import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware untuk memverifikasi JWT Token
 */
export const verifyToken = (req, res, next) => {
  // Ambil token dari header Authorization
  const authHeader = req.headers["authorization"];

  // Token formatnya: "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    // Kalo gak ada token, kita tolak
    return res.status(401).json({ error: "Akses ditolak. Token tidak ada." });
  }

  // Verifikasi tokennya
  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      // Kalo tokennya salah/expired, kita tolak
      return res.status(403).json({ error: "Token tidak valid." });
    }

    // Kalo token bener, kita simpan data user (dari payload token)
    // ke `req.user` biar bisa dipake sama controller
    req.user = userPayload;

    next(); // Lanjut ke fungsi controller (generateImage)
  });
};

export const verifyAdmin = (req, res, next) => {
  // Cek apakah role di token adalah 'ADMIN'
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ error: "forbidden!" });
  }
};
