import express from 'express';
import { generateImage,editImage } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/v1/ai

// dokumentasi swagger


router.post('/generate-image',verifyToken, generateImage);
router.post('/edit-image',verifyToken, editImage);

export default router;