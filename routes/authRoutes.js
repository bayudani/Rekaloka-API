import express from 'express';
import { register, verify, login } from '../controllers/authController.js';

const router = express.Router();

// Base path: /api/v1/auth
router.post('/register', register);
router.post('/verify', verify);
router.post('/login', login);

export default router;