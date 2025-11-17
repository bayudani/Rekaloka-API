/**
 * Membuat kode verifikasi 6 digit
 * @returns {number} Kode 6 digit
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000);
};