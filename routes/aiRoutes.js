import express from 'express';
import { generateImage } from '../controllers/aiController.js';
// TODO: Impor middleware JWT nanti di sini
// import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/v1/ai
// TODO: Tambahin verifyToken nanti kalo udah siap
router.post('/generate-image', generateImage);

export default router;