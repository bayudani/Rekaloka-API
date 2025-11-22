import express from 'express';
import { register, verify, login,resendCode } from '../controllers/authController.js';

const router = express.Router();

// Base path: /api/auth
router.post('/register', register);
router.post('/verify', verify);
router.post('/login', login);
router.post('/resend-code', resendCode);


export default router;