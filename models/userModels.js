import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Membuat user baru di database
 */
export const createUser = async (data) => {
    return await prisma.user.create({
        data: data,
    });
};

/**
 * Mencari user berdasarkan email
 */
export const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email },
    });
};

/**
 * Mengupdate status verifikasi user
 */
export const verifyUser = async (email) => {
    return await prisma.user.update({
        where: { email },
        data: {
            is_verify: true,
            verification_code: null, // Hapus kode setelah berhasil
        },
    });
};

// find user login
export const findUserForLogin = async (email) => {
    return await prisma.user.findUnique({
        where: { email },
    });
};

// get profile user
export const getUserProfile = async (userId) => {
    return await prisma.user.findUnique({
        where: { id: userId },
    });
};

// get exp and level
export const getUserExpAndLevel = async (userId) => {
    return await prisma.user.findUnique({
        where: { id: userId },
        select: {
            exp: true,
            level: true,
        },
    });
};