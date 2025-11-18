import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/', verifyToken, uploadImage);

export default router;