import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Impor dari helpers dan models
import { sendVerificationEmail } from '../helpers/mailer.js';
import { generateVerificationCode } from '../helpers/generator.js';
import { createUser, findUserByEmail, verifyUser } from '../models/userModels.js';

const JWT_SECRET = process.env.JWT_SECRET;

// --- 1. REGISTER ---
export const register = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, dan password harus diisi' });
  }

  try {
    // 1. Cek duplikasi (Panggil Model)
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email atau username sudah digunakan' });
    }

    // 2. Logic di Controller
    const hashedPassword = await bcrypt.hash(password, 10);
    const verification_code = generateVerificationCode(); // Panggil Helper

    // 3. Simpan user ke DB (Panggil Model)
    const user = await createUser({
      email,
      username,
      password: hashedPassword,
      verification_code: verification_code,
      is_verify: false,
    });

    // 4. Kirim email (Panggil Helper)
    await sendVerificationEmail(email, username, verification_code);

    // 5. Kirim respon
    res.status(201).json({
      message: 'Registrasi berhasil. Cek email buat kode verifikasi.',
      userId: user.id
    });

  } catch (error) {
    //  HANDLE ERROR DUPLIKASI PRISMA (P2002) ---
    if (error.code === 'P2002') {
      //  "target"-nya apa yang duplikat (kolom mana yang nabrak)
      const target = error.meta?.target;
      
      // 1. Kalo targetnya Username (User_username_key)
      if (target === 'User_username_key' || (Array.isArray(target) && target.includes('username'))) {
        return res.status(409).json({ error: 'Username udah dipake orang lain' });
      }
      // 2. Kalo targetnya Email (Jaga-jaga kalo lolos dari cek manual di atas)
      if (target === 'User_email_key' || (Array.isArray(target) && target.includes('email'))) {
        return res.status(409).json({ error: 'Email udah terdaftar. Coba login aja.' });
      }
      // Default kalo bingung mana yang duplikat
      return res.status(409).json({ error: 'Username atau Email udah ada yang make.' });
    }

    console.error('Error registrasi:', error);
    res.status(500).json({ error: 'Registrasi gagal, coba lagi nanti' });
  }
};

// --- 2. VERIFY ---
export const verify = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email dan kode harus diisi' });
  }

  try {
    // 1. Cari user (Panggil Model)
    const user = await findUserByEmail(email);

    // 2. Logic di Controller
    if (!user) {
      return res.status(404).json({ error: 'User gak ditemukan' });
    }
    if (user.is_verify) {
      return res.status(400).json({ error: 'Akun udah terverifikasi' });
    }
    if (user.verification_code !== parseInt(code)) {
      return res.status(400).json({ error: 'Kode verifikasi salah' });
    }

    // 3. Update DB (Panggil Model)
    await verifyUser(email);

    // 4. Kirim respon
    res.status(200).json({ message: 'Akun berhasil diverifikasi. Silakan login.' });

  } catch (error) {
    console.error('Error verifikasi:', error);
    res.status(500).json({ error: 'Verifikasi gagal, coba lagi nanti' });
  }
};

// --- 3. LOGIN ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password harus diisi' });
  }

  try {
    // 1. Cari user (Panggil Model)
    const user = await findUserByEmail(email);

    // 2. Logic di Controller
    if (!user) {
      return res.status(404).json({ error: 'Email atau password salah' });
    }
    if (!user.is_verify) {
      return res.status(403).json({ error: 'Akun belum diverifikasi. Cek email!' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({ error: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userData } = user;

    // 3. Kirim respon
    res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: userData,
    });

  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ error: 'Login gagal, coba lagi nanti' });
  }
};

