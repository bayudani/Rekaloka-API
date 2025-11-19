import express from "express";
import {
    getProfile,
    getExpAndLevel,
    getCheckInHistory,
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

export default router;
