import express from 'express';
import {
    createNewHotspot,
    getAllHotspots,
    getHotspotById,
    getHotspotsByProvince,
    updateHotspotById,
    deleteHotspotById
} from '../controllers/hotspotController.js';

import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();


// === Rute Publik (GET) ===
// Siapapun boleh liat data hotspot
router.get('/', getAllHotspots);
router.get('/:id', getHotspotById);
router.get('/by-province/:provinceId', getHotspotsByProvince); // Penting buat nampilin di Peta

// === Rute Terproteksi (POST, PUT, DELETE) ===
// Cuma user yang udah login (dan punya token) yang boleh
router.post('/', verifyToken, createNewHotspot);
router.put('/:id', verifyToken, updateHotspotById);
router.delete('/:id', verifyToken,verifyAdmin, deleteHotspotById);

export default router;