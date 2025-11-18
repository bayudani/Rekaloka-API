import express from 'express';
import { register, verify, login, getProfile,getExpAndLevel } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/v1/auth
router.post('/register', register);
router.post('/verify', verify);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.get('/exp-level', verifyToken, getExpAndLevel);

export default router;