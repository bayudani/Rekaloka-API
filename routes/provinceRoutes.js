import express from 'express';
import {
    getProvinces,
    getProvinceById,
    createNewProvince,
    updateProvinceById,
    deleteProvinceById
} from '../controllers/provinceController.js';

// Impor middleware JWT
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base path: /api/v1/provinces

// === Rute Publik (GET) ===
// Siapapun boleh liat data provinsi
router.get('/', getProvinces);
router.get('/:id', getProvinceById);

// === Rute Terproteksi (POST, PUT, DELETE) ===
// Cuma user yang udah login (dan punya token) yang boleh
router.post('/', verifyToken, createNewProvince);
router.put('/:id', verifyToken, updateProvinceById);
router.delete('/:id', verifyToken, deleteProvinceById);

export default router;