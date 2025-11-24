import express from 'express';
import { generateImage,editImage,generate3DWithShapE,generate3DFromImage,generateTripo3D } from '../controllers/aiController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/ai

// dokumentasi swagger


router.post('/generate-image',verifyToken, generateImage);
router.post('/edit-image',verifyToken, editImage);
router.post('/generate-3d',verifyToken, generate3DWithShapE);
router.post('/generate-3d-image',verifyToken, generate3DFromImage);
router.post('/generate-tripo',verifyToken, generateTripo3D);
// router.post('/generate-3d',verifyToken, generate3D);

export default router;