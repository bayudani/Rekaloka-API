import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../helpers/mailer.js';
import { generateVerificationCode } from '../helpers/generator.js';
import { createUser, findUserByEmail, verifyUser, updateVerificationCode } from '../models/userModels.js';

const JWT_SECRET = process.env.JWT_SECRET;

// --- 1. REGISTER ---
export const register = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email, username, dan password harus diisi'
    });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email atau username sudah digunakan'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verification_code = generateVerificationCode();

    const user = await createUser({
      email,
      username,
      password: hashedPassword,
      verification_code: verification_code,
      is_verify: false,
    });

    await sendVerificationEmail(email, username, verification_code);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Cek email buat kode verifikasi.',
      data: { userId: user.id }
    });

  } catch (error) {
    // Handle Prisma Duplicate Error
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      let msg = 'Username atau Email sudah ada yang make.';

      if (target === 'User_username_key' || (Array.isArray(target) && target.includes('username'))) {
        msg = 'Username udah dipake orang lain';
      } else if (target === 'User_email_key' || (Array.isArray(target) && target.includes('email'))) {
        msg = 'Email udah terdaftar. Coba login aja.';
      }

      return res.status(409).json({
        success: false,
        message: msg
      });
    }

    console.error('Error registrasi:', error);
    res.status(500).json({
      success: false,
      message: 'Registrasi gagal, coba lagi nanti'
    });
  }
};

// --- 2. VERIFY ---
export const verify = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: 'Email dan kode harus diisi'
    });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User gak ditemukan'
      });
    }
    if (user.is_verify) {
      return res.status(400).json({
        success: false,
        message: 'Akun udah terverifikasi'
      });
    }
    if (user.verification_code !== parseInt(code)) {
      return res.status(400).json({
        success: false,
        message: 'Kode verifikasi salah'
      });
    }

    await verifyUser(email);

    res.status(200).json({
      success: true,
      message: 'Akun berhasil diverifikasi. Silakan login.'
    });

  } catch (error) {
    console.error('Error verifikasi:', error);
    res.status(500).json({
      success: false,
      message: 'Verifikasi gagal, coba lagi nanti'
    });
  }
};

// --- 3. LOGIN ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password harus diisi'
    });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email atau password salah'
      });
    }
    if (!user.is_verify) {
      return res.status(403).json({
        success: false,
        message: 'Akun belum diverifikasi. Cek email!'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userData } = user;

    res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        token,
        user: userData
      }
    });

  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({
      success: false,
      message: 'Login gagal, coba lagi nanti'
    });
  }
};

export const resendCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email wajib diisi, bro!'
    });
  }

  try {
    // 1. Cari User pake helper yang udah ada
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email gak terdaftar.'
      });
    }

    // 2. Cek kalo udah verified, ngapain minta lagi?
    if (user.is_verify) {
      return res.status(400).json({
        success: false,
        message: 'Akun udah verified kok. Login aja langsung!'
      });
    }

    // 3. Generate Kode Baru pake helper generator
    const newCode = generateVerificationCode();

    // 4. Update Kode di Database (Pake fungsi model baru)
    await updateVerificationCode(email, newCode);

    // 5. Kirim Email lagi pake helper mailer
    await sendVerificationEmail(email, user.username, newCode);

    res.status(200).json({
      success: true,
      message: 'Kode baru udah dikirim. Cek inbox/spam ya!',
      cooldown: 60
    });

  } catch (error) {
    console.error('Error resend OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal kirim ulang kode, coba bentar lagi.'
    });
  }
};