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

// updateVerificationCode
export const updateVerificationCode = async (email, code) => {
    return await prisma.user.update({
        where: { email },
        data: {
            verification_code: code

        }
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
        select: {
            email: true,
            username: true,
            level: true,
            exp: true,
            // role: true
            // badges: true
        },
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

export const getTopUsers = async (limit = 10) => {
    return await prisma.user.findMany({
        take: limit,
        orderBy: [
            { level: 'desc' }, // Prioritas 1: Level Tertinggi
            { exp: 'desc' }    // Prioritas 2: EXP Tertinggi
        ],
        select: {
            id: true,
            username: true,
            level: true,
            exp: true,
            // Kita tampilin badge utamanya juga biar keren
            badges: {
                take: 3, // Ambil 3 badge teratas
                select: {
                    name: true,
                    iconUrl: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });
};


// update user password
export const getUserPasswordHash = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
    });
    return user?.password;
};

// update user profile 
export const updateUserProfile = async (userId, data) => {
    return await prisma.user.update({
        where: { id: userId },
        data: data,
        select: {
            id: true,
            username: true,
            email: true
        }
    });
};
