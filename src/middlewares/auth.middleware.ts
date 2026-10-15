import type { Request, Response, NextFunction } from "express";
import { JwtService } from "../utils/jwt";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { ForbiddenError } from "../errors/forbidden.error";
import { prisma } from "../lib/prisma";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

/**
 * Protects routes by validating JWT tokens in the Authorization header.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Authentication token is malformed.");
    }
    const decoded = JwtService.verifyToken(token);
    
    if (!decoded) {
      throw new UnauthorizedError("Session has expired or token is invalid.");
    }

    // Verify user still exists in the database
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, roles: true },
    });

    if (!dbUser) {
      throw new UnauthorizedError("Associated user account no longer exists.");
    }

    // Populate user context
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      roles: dbUser.roles,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restricts route access to specific roles (e.g. VENDOR, DOCTOR, ADMIN)
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User is not authenticated.");
      }

      // Check if user has at least one of the allowed roles
      const hasPermission = req.user.roles.some((role) =>
        allowedRoles.includes(role)
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          `Access Denied. Required role: [${allowedRoles.join(", ")}]`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
