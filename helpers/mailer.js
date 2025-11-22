import nodemailer from 'nodemailer';

// --- Konfigurasi Nodemailer ---
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    connectionTimeout: 10000, 
});

/**
 * Mengirim email verifikasi
 * @param {string} to - Email tujuan
 * @param {string} username - Username user
 * @param {string} code - Kode verifikasi
 */
export const sendVerificationEmail = async (to, username, code) => {
    const mailOptions = {
        from: `"Rekaloka Team" <${process.env.MAIL_USER}>`,
        to: to,
        subject: 'Kode Verifikasi Akun Rekaloka kamu',
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Halo, ${username}!</h2>
        <p>Terimakasih udah daftar di Rekaloka. Ini kode verifikasi kamu:</p>
        <h1 style="font-size: 3rem; letter-spacing: 0.5rem; margin: 2rem 0; text-align: center;">
          ${code}
        </h1>
        <p>Masukkan kode ini di aplikasi buat ngelanjutin, ya. Jangan kasih tau siapa-siapa!</p>
        <br>
        <p>Salam hangat,</p>
        <p>Tim Rekaloka</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email verifikasi terkirim ke ${to}`);
    } catch (error) {
        console.error(`Error kirim email ke ${to}:`, error);
        // Kita gak throw error di sini biar gak nge-block registrasi,
        // tapi kita log error-nya
    }
};

