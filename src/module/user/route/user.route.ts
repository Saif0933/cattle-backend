import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateSchema } from "../../../middlewares/validation.middleware";
import { UserController } from "../controller/user.controller";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../validator/user.validator";

const router = Router();

// Register a new user
router.post(
  "/register",
  validateSchema(registerSchema),
  UserController.register
);

// Authenticate user
router.post(
  "/login",
  validateSchema(loginSchema),
  UserController.login
);

// Get authenticated user profile details
router.get(
  "/profile",
  authenticate as any,
  UserController.getProfile
);

// Update user profile properties
router.patch(
  "/profile",
  authenticate as any,
  validateSchema(updateProfileSchema),
  UserController.updateProfile
);

// ==========================================
// 3. SECURED SOCIAL/FOLLOW ROUTES (Requires Token)
// ==========================================

// Toggle following target user (follow / unfollow)
router.post(
  "/follow",
  authenticate as any,
  UserController.toggleFollow
);

// Get followers of any user (defaults to current user if parameter omitted)
router.get(
  "/followers",
  authenticate as any,
  UserController.getFollowers
);
router.get(
  "/followers/:id",
  authenticate as any,
  UserController.getFollowers
);

// Get following list of any user (defaults to current user if parameter omitted)
router.get(
  "/following",
  authenticate as any,
  UserController.getFollowing
);
router.get(
  "/following/:id",
  authenticate as any,
  UserController.getFollowing
);

export default router;
