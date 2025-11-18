import express from 'express';
import { generateImage } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/v1/ai
router.post('/generate-image',verifyToken, generateImage);

export default router;