import express from 'express';
import {
    getProvinces,
    getProvinceById,
    createNewProvince,
    updateProvinceById,
    deleteProvinceById
} from '../controllers/provinceController.js';

import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();


// === Rute Publik (GET) ===
// Siapapun boleh liat data provinsi
router.get('/', getProvinces);
router.get('/:id', getProvinceById);

// === Rute Terproteksi (POST, PUT, DELETE) ===
// Cuma user yang udah login (dan punya token) yang boleh
router.post('/', verifyToken, verifyAdmin, createNewProvince);
router.put('/:id', verifyToken,verifyAdmin, updateProvinceById);
router.delete('/:id', verifyToken,verifyAdmin, deleteProvinceById);

export default router;