import { PrismaClient } from '@prisma/client';
import { BADGE_MASTER_LIST } from '../helpers/badgeConstants.js'; 

const prisma = new PrismaClient();

export const checkAndAwardBadges = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: { select: { checkIns: { where: { isValidated: true } } } },
                badges: true 
            }
        });

        if (!user) return;

        const checkInCount = user._count.checkIns;
        const userLevel = user.level;
        const existingBadgeNames = user.badges.map(b => b.name);
        const newBadges = [];   

        const getBadge = (id) => BADGE_MASTER_LIST.find(b => b.id === id);

        // --- 1. Turis Biasa (Check-in >= 1) ---
        const b1 = getBadge('badge_turis_biasa');
        if (checkInCount >= 1 && !existingBadgeNames.includes(b1.name)) {
            newBadges.push({
                name: b1.name,
                description: b1.description,
                iconUrl: b1.iconUrl,
                userId: userId
            });
        }

        // --- 2. Penjelajah Budaya (Check-in >= 5) ---
        const b2 = getBadge('badge_penjelajah_budaya');
        if (checkInCount >= 5 && !existingBadgeNames.includes(b2.name)) {
            newBadges.push({
                name: b2.name,
                description: b2.description,
                iconUrl: b2.iconUrl,
                userId: userId
            });
        }

        // --- 3. Pakar Warisan (Level >= 5) ---
        const b3 = getBadge('badge_pakar_warisan');
        if (userLevel >= 5 && !existingBadgeNames.includes(b3.name)) {
            newBadges.push({
                name: b3.name,
                description: b3.description,
                iconUrl: b3.iconUrl,
                userId: userId
            });
        }

        // --- 4. Maestro Budaya (Level >= 10) ---
        // Ini kasta tertinggi bro!
        const b4 = getBadge('badge_maestro_budaya');
        if (userLevel >= 10 && !existingBadgeNames.includes(b4.name)) {
            newBadges.push({
                name: b4.name,
                description: b4.description,
                iconUrl: b4.iconUrl,
                userId: userId
            });
        }

        // --- Eksekusi ---
        if (newBadges.length > 0) {
            await prisma.badge.createMany({ data: newBadges });
            console.log(`User ${user.username} naik pangkat! Dapet: ${newBadges.map(b => b.name).join(', ')}`);
            return newBadges;
        }

        return [];

    } catch (error) {
        console.error("Error awarding badges:", error);
    }
};