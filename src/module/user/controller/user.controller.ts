import type { Response, NextFunction } from "express";
import { prisma } from "../../../lib/prisma";
import { JwtService } from "../../../utils/jwt";
import { bcrypt } from "../../../utils/bcrypt";
import { BadRequestError } from "../../../errors/bad-request.error";
import { UnauthorizedError } from "../../../errors/unauthorized.error";
import { NotFoundError } from "../../../errors/not-found.error";
import { ApiResponse } from "../../../utils/response";
import type { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class UserController {
  /**
   * Register a new user
   */
  
  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name, phone } = req.body;

      // 1. Verify email uniqueness
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUserByEmail) {
        throw new BadRequestError("Email address is already registered.");
      }

      // 2. Verify phone uniqueness if supplied
      if (phone) {
        const existingUserByPhone = await prisma.user.findUnique({
          where: { phone },
        });
        if (existingUserByPhone) {
          throw new BadRequestError("Phone number is already registered.");
        }
      }

      // 3. Hash secret password
      const passwordHash = bcrypt.hashPassword(password);

      // 4. Store user in database
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
          roles: ["USER"], // Default standard role
        },
      });

      // 5. Generate secure session token
      const token = JwtService.generateToken({
        id: user.id,
        email: user.email,
        roles: user.roles,
      });

      // 6. Return response (sanitizing password hash)
      const { passwordHash: _, ...sanitizedUser } = user;
      return ApiResponse.success(
        res,
        "User registration completed successfully.",
        { user: sanitizedUser, token },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authenticate a user and issue JWT
   */
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // 1. Fetch user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user || !user.passwordHash) {
        throw new UnauthorizedError("Invalid email or password.");
      }

      // 2. Compare secure password hash
      const isPasswordMatch = bcrypt.comparePassword(password, user.passwordHash);
      if (!isPasswordMatch) {
        throw new UnauthorizedError("Invalid email or password.");
      }

      // 3. Generate session token
      const token = JwtService.generateToken({
        id: user.id,
        email: user.email,
        roles: user.roles,
      });

      // 4. Return sanitized payload
      const { passwordHash: _, ...sanitizedUser } = user;
      return ApiResponse.success(res, "Authentication successful.", {
        user: sanitizedUser,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch current authenticated user profile details
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError("Missing request session context.");
      }

      // Query complete profile and sub-profiles
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          doctorProfile: true,
          breederProfile: true,
          _count: {
            select: {
              listings: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError("User profile could not be found.");
      }

      const { passwordHash: _, ...sanitizedUser } = user;
      return ApiResponse.success(res, "Profile retrieved successfully.", sanitizedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile information
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError("Missing request session context.");
      }

      const { name, phone, avatar, address, latitude, longitude, roles } = req.body;

      // Check phone duplication if phone is updated
      if (phone) {
        const phoneOwner = await prisma.user.findUnique({
          where: { phone },
        });
        if (phoneOwner && phoneOwner.id !== userId) {
          throw new BadRequestError("This phone number is already taken by another account.");
        }
      }

      // Perform user update in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          phone,
          avatar,
          address,
          latitude,
          longitude,
          roles: roles ? (roles as any) : undefined, // Postgres-native array mapping
        },
      });

      const { passwordHash: _, ...sanitizedUser } = updatedUser;
      return ApiResponse.success(res, "Profile updated successfully.", sanitizedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle follow/unfollow logic for a seller/user
   */
  static async toggleFollow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const followerId = req.user?.id;
      const { targetUserId } = req.body;

      if (!followerId) {
        throw new UnauthorizedError("Missing request session context.");
      }

      if (followerId === targetUserId) {
        throw new BadRequestError("You cannot follow your own user account.");
      }

      // Check if target user actually exists
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!targetUser) {
        throw new NotFoundError("Target user for following does not exist.");
      }

      // Look up existing follow relationship
      const existingFollow = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUserId,
          },
        },
      });

      if (existingFollow) {
        // Unfollow: delete join entry
        await prisma.userFollow.delete({
          where: {
            followerId_followingId: {
              followerId,
              followingId: targetUserId,
            },
          },
        });
        return ApiResponse.success(res, `Successfully unfollowed user ${targetUser.name || ""}.`, {
          following: false,
        });
      } else {
        // Follow: create join entry
        await prisma.userFollow.create({
          data: {
            followerId,
            followingId: targetUserId,
          },
        });
        return ApiResponse.success(res, `Successfully followed user ${targetUser.name || ""}.`, {
          following: true,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * List user's followers
   */
  static async getFollowers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const targetId = typeof id === "string" ? id : req.user?.id;

      if (!targetId || typeof targetId !== "string") {
        throw new BadRequestError("Missing or invalid target user parameter.");
      }

      const followersList = await prisma.userFollow.findMany({
        where: { followingId: targetId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              roles: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const followers = followersList.map((f) => f.follower);
      return ApiResponse.success(res, "Followers list retrieved.", followers);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List users current user is following
   */
  static async getFollowing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const targetId = typeof id === "string" ? id : req.user?.id;

      if (!targetId || typeof targetId !== "string") {
        throw new BadRequestError("Missing or invalid target user parameter.");
      }

      const followingList = await prisma.userFollow.findMany({
        where: { followerId: targetId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              roles: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const following = followingList.map((f) => f.following);
      return ApiResponse.success(res, "Following list retrieved.", following);
    } catch (error) {
      next(error);
    }
  }
}
export const userController = UserController;
