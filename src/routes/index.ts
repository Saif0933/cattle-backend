import { Router } from "express";
import userRoutes from "../module/user/route/user.route";

const router = Router();


// User Domain Routes
router.use("/user", userRoutes);

export default router;
