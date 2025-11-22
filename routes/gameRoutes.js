import express from 'express';
import { checkInLocation } from '../controllers/gameController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/game

// POST /check-in
router.post('/check-in', verifyToken, checkInLocation);


export default router;