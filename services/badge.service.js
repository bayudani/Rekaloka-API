import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Cek dan kasih badge ke user berdasarkan pencapaian mereka
 * @param {string} userId - ID User
 */
export const checkAndAwardBadges = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: { select: { checkIns: { where: { isValidated: true } } } }, // Hitung check-in valid
                badges: true // Ambil badge yang udah punya
            }
        });

        if (!user) return;

        const checkInCount = user._count.checkIns;
        const userLevel = user.level;
        const existingBadgeNames = user.badges.map(b => b.name);

        const newBadges = [];

        // --- RULE 1: Check-in Pertama Kali ---
        if (checkInCount >= 1 && !existingBadgeNames.includes('Langkah Awal')) {
            newBadges.push({
                name: 'Langkah Awal',
                description: 'Selamat! Lo udah mulai perjalanan melestarikan budaya.',
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/2997/2997250.png', // Ganti icon sesuka hati
                userId: userId
            });
        }

        // --- RULE 2: Check-in 5 Kali ---
        if (checkInCount >= 5 && !existingBadgeNames.includes('Petualang Sejati')) {
            newBadges.push({
                name: 'Petualang Sejati',
                description: 'Gokil! Lo udah mengunjungi 5 situs budaya.',
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/6706/6706760.png',
                userId: userId
            });
        }

        // --- RULE 3: Level 5 (Sepuh Pemula) ---
        if (userLevel >= 5 && !existingBadgeNames.includes('Warga Lokal')) {
            newBadges.push({
                name: 'Warga Lokal',
                description: 'Level 5! Lo udah mulai dikenal di tongkrongan budaya.',
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png',
                userId: userId
            });
        }

        // --- Eksekusi Pemberian Badge ---
        if (newBadges.length > 0) {
            await prisma.badge.createMany({
                data: newBadges
            });
            console.log(`User ${user.username} dapet ${newBadges.length} badge baru!`);
            return newBadges; // Balikin data badge baru buat notif (opsional)
        }

        return [];

    } catch (error) {
        console.error("Error awarding badges:", error);
    }
};