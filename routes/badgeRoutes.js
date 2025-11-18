import express from 'express';
import { getMyBadges, getUserBadges } from '../controllers/badgeController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();


// Ambil badge punya sendiri (Wajib Login)
router.get('/my', verifyToken, getMyBadges);

// Ambil badge user lain (Bisa public atau proteksi, bebas)
router.get('/:userId', getUserBadges);

export default router;