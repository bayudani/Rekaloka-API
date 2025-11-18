import express from 'express';
import { checkInLocation } from '../controllers/gameController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/v1/game

// POST /check-in
// Wajib login (pake verifyToken)
router.post('/check-in', verifyToken, checkInLocation);

export default router;