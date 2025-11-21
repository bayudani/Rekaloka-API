/**
 * Menghitung Level user saat ini berdasarkan Total EXP.
 * Menggunakan kurva eksponensial (makin tinggi level, makin susah).
 * * Rumus dasar: EXP = CONSTANT * (Level - 1)^2
 * Kita balik jadi: Level = Math.floor(Math.sqrt(EXP / CONSTANT)) + 1
 */
const CONSTANT = 100; // Konstanta tingkat kesulitan (Makin kecil = makin gampang naik level)

export const calculateLevel = (totalExp) => {
    // Contoh:
    // EXP 0 - 99   => Level 1
    // EXP 100 - 399 => Level 2
    // EXP 400 - 899 => Level 3
    const level = Math.floor(Math.sqrt(totalExp / CONSTANT)) + 1;
    return level;
};

/**
 * Menghitung detail progress bar buat Frontend.
 * Mengembalikan data: Level skrg, EXP skrg, Target EXP level depan, % Progress.
 */
export const calculateLevelProgress = (totalExp) => {
    const currentLevel = calculateLevel(totalExp);
    
    // Batas bawah EXP level ini (Misal Level 2 mulai dari 100 EXP)
    const currentLevelBaseExp = CONSTANT * Math.pow(currentLevel - 1, 2);
    
    // Target EXP buat naik ke level berikutnya (Misal Level 3 butuh 400 EXP)
    const nextLevelThreshold = CONSTANT * Math.pow(currentLevel, 2);
    
    // Hitung progress dalam persen (0 - 100%)
    // Rumus: (EXP Sekarang - Awal Level Ini) / (Target Level Depan - Awal Level Ini) * 100
    const expEarnedInThisLevel = totalExp - currentLevelBaseExp;
    const expRange = nextLevelThreshold - currentLevelBaseExp;
    
    let progressPercent = 0;
    if (expRange > 0) {
        progressPercent = Math.floor((expEarnedInThisLevel / expRange) * 100);
    }

    // Balikin struktur JSON yang simpel sesuai request lo
    return {
        currentLevel: currentLevel,       // Level sekarang (Contoh: 2)
        currentExp: totalExp,             // Total EXP user (Contoh: 250)
        nextLevelExp: nextLevelThreshold, // Target EXP level depan (Contoh: 400)
        progress: progressPercent         // Persentase 0-100 (Contoh: 50)
    };
};