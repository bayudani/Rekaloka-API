import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Mengambil semua provinsi
 */
export const findAllProvinces = async () => {
    return await prisma.province.findMany({
        include: {
            _count: {
                select: { hotspots: true }, // Hitung ada berapa hotspot di tiap provinsi
            },
        },
    });
};

/**
 * Mengambil satu provinsi berdasarkan ID
 */
export const findProvinceById = async (id) => {
    const province = await prisma.province.findUnique({
        where: { id: id },
        include: {
            hotspots: true, // Ambil semua data hotspot yang terkait
        },
    });

    // Ubah JSON string jadi objek beneran
    if (province && province.iconicInfoJson) {
        province.iconicInfo = JSON.parse(province.iconicInfoJson);
    }

    return province;
};

/**
 * Membuat provinsi baru
 */
export const createProvince = async (data) => {
    return await prisma.province.create({
        data: data,
    });
};

/**
 * Mengupdate provinsi berdasarkan ID
 */
export const updateProvince = async (id, data) => {
    return await prisma.province.update({
        where: { id: id },
        data: data,
    });
};

/**
 * Menghapus provinsi berdasarkan ID
 */
export const deleteProvince = async (id) => {
    return await prisma.province.delete({
        where: { id: id },
    });
};