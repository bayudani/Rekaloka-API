import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Membuat hotspot baru
 */
export const createHotspot = async (data) => {
    return await prisma.culturalHotspot.create({
        data: data,
    });
};

/**
 * Mengambil semua hotspot
 */
export const findAllHotspots = async () => {
    return await prisma.culturalHotspot.findMany();
};

/**
 * Mengambil hotspot berdasarkan ID
 */
export const findHotspotById = async (id) => {
    return await prisma.culturalHotspot.findUnique({
        where: { id: id },
    });
};

/**
 * Mengambil semua hotspot berdasarkan provinceId
 */
export const findHotspotsByProvinceId = async (provinceId) => {
    return await prisma.culturalHotspot.findMany({
        where: { provinceId: provinceId },
    });
};

/**
 * Mengupdate hotspot berdasarkan ID
 */
export const updateHotspot = async (id, data) => {
    return await prisma.culturalHotspot.update({
        where: { id: id },
        data: data,
    });
};

/**
 * Menghapus hotspot berdasarkan ID
 */
export const deleteHotspot = async (id) => {
    return await prisma.culturalHotspot.delete({
        where: { id: id },
    });
};