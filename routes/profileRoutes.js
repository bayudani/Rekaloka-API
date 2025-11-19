import express from "express";
import {
    getProfile,
    getExpAndLevel,
    getCheckInHistory,
    updateProfile,
    changePassword
} from "../controllers/profileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Base path: /api/profile

// GET /profile
router.get("/", verifyToken, getProfile);

// GET /exp-level
router.get("/exp-level", verifyToken, getExpAndLevel);
// GET /check-in-history
router.get("/check-in-history", verifyToken, getCheckInHistory);

// PUT /profile
router.put("/update", verifyToken, updateProfile);

// PUT /profile/change-password
router.put("/change-password", verifyToken, changePassword);

export default router;
