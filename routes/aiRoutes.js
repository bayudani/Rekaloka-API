import express from 'express';
import { generateImage,editImage,generate3D } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/ai

// dokumentasi swagger


router.post('/generate-image',verifyToken, generateImage);
router.post('/edit-image',verifyToken, editImage);
router.post('/generate-3d',verifyToken, generate3D);

export default router;