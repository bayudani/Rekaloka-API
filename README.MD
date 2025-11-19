## 🚀 Fitur Utama

1. **Autentikasi Modern:**
   - Register & Login aman (JWT + BCrypt).
   - Verifikasi Email (OTP via Nodemailer).
   - Role-Based Access Control (USER vs ADMIN).
2. **Eksplorasi Peta Budaya (38 Provinsi):**
   - Data detail tiap provinsi (Deskripsi, Logo, Background).
   - **LBS (Location Based Service):** Sorting provinsi terdekat dari lokasi user.
   - Info budaya "abstrak" (Tari, Suku, Bahasa) via JSON dinamis.
   - Info budaya "fisik" (Candi, Museum) via titik koordinat GPS.
3. **Game Adaptif Lokasi (LBS):**
   - **Check-in System:** Validasi User harus berada di radius < 100m dari lokasi.
   - **AI Vision Validation:** Foto bukti check-in divalidasi otomatis oleh **Google Gemini** (Beneran foto Candi gak?).
   - **Cloud Upload:** Bukti foto otomatis di-upload ke **Cloudinary** .
   - **Leveling System:** Dapet EXP tiap check-in, Level user naik otomatis.
4. **Gamification (Badges & Leaderboard):**
   - Sistem **Badge Otomatis** (Trigger saat check-in).
   - **Leaderboard:** Liat siapa sepuh budaya paling niat se-Indonesia.
5. **AI Text-to-Image:**
   - Generate konsep gambar budaya 2D pake **Google Imagen 4.0** .

## 🛠️ Tech Stack & Tools

- **Core:** Node.js, Express.js (ES Modules)
- **Database:** MySQL (via Prisma ORM)
- **Auth:** `jsonwebtoken` (JWT), `bcrypt`
- **Email:** `nodemailer`
- **AI Engine:**
  - Google Gemini 1.5 Flash (Vision/Image Analysis)
  - Google Imagen 4.0 (Image Generation)
- **Storage:** Cloudinary (Upload gambar gratis & kenceng)
- **Caching:** Redis (via `ioredis`) buat performa ngebut.
- **Utils:** `geo.js` (Haversine Formula buat jarak GPS).

## 🏃 Cara Setup & Jalanin (Localhost)

1. **Clone Repository:**

   ```
   git clone <repo_url>
   cd rekaloka-backend
   ```
2. **Install Dependencies:**

   ```
   npm install
   ```
3. **Setup Environment Variables (`.env`):**
   Buat file `.env` (copas dari `.env.example`). Isi data rahasia lo:

   - `DATABASE_URL`: Koneksi MySQL.
   - `GOOGLE_API_KEY`: API Key Google AI Studio.
   - `CLOUDINARY_*`: Config Cloudinary.
   - `REDIS_URL`: Koneksi Redis (Lokal/Cloud).
   - `MAIL_*`: Config Nodemailer (Gmail App Password).
4. **Database Migration (PENTING!):**
   Bikin tabel di database lo otomatis.

   ```
   npx prisma migrate dev --name init
   ```
5. **Jalanin Server:**

   ```
   npm run dev
   ```

   Server jalan di: `http://localhost:3001`

## 📖 Dokumentasi API Lengkap ()

Base URL: `http://localhost:3001/api/`

> **Note:** Semua endpoint yang butuh login wajib pake Header:
> `Authorization: Bearer <token_jwt_lo>`

### 🔐 1. Auth (`/auth`)

| Method   | Endpoint      | Deskripsi                          | Body / Payload                                               |
| -------- | ------------- | ---------------------------------- | ------------------------------------------------------------ |
| `POST` | `/register` | Daftar user baru & kirim OTP email | `{ "email": "...", "username": "...", "password": "..." }` |
| `POST` | `/verify`   | Verifikasi akun pake OTP           | `{ "email": "...", "code": 123456 }`                       |
| `POST` | `/login`    | Masuk & dapet Token JWT            | `{ "email": "...", "password": "..." }`                    |

### 🗺️ 2. Provinces (`/provinces`)

Data provinsi buat Peta Interaktif.

#### `GET /`

Mengambil semua data provinsi.

- **Tanpa Query:** Urutan default database.
- **LBS Mode:** `?lat=-6.2&long=106.8` (Urutkan berdasarkan jarak terdekat dari user).

#### `GET /:id`

Detail lengkap provinsi termasuk `hotspots` (titik lokasi) dan `iconicInfo` (budaya abstrak).

#### `POST /` (Admin Only)

Membuat provinsi baru.

**Body JSON:**

```
{
  "name": "Jawa Barat",
  "description": "Provinsi dengan kearifan lokal Sunda...",
  "backsoundUrl": "[https://link-lagu.mp3](https://link-lagu.mp3)",
  "latitude": -6.9175,
  "longitude": 107.6191,
  "iconicInfoJson": "{\"tarian\": [\"Jaipong\"], \"makanan\": [\"Batagor\"]}",
  "logoBase64": "data:image/png;base64,...",
  "backgroundBase64": "data:image/jpeg;base64,..."
}
```

#### `PUT /:id` (Admin Only)

Update data (Partial Update). Cukup kirim field yang mau diubah.

**Body JSON:**

```
{
  "description": "Update deskripsi baru...",
  "iconicInfoJson": { ... } // Backend otomatis merge sama data lama
}
```

### 📍 3. Cultural Hotspots (`/hotspots`)

Titik lokasi fisik (Candi, Museum, Warung) yang ada di peta.

#### `GET /by-province/:provinceId`

Mengambil semua hotspot di provinsi tertentu.

#### `GET /:id`

Detail satu hotspot.

#### `POST /` (Admin Only)

Menambah lokasi baru.

**Body JSON:**

```
{
  "name": "Gedung Sate",
  "description": "Ikon kota Bandung...",
  "type": "Monumen",
  "latitude": -6.9022,
  "longitude": 107.6186,
  "provinceId": "clx_id_jawa_barat",
  "imageBase64": "data:image/jpeg;base64,..."
}
```

### 🎮 4. Game LBS & Check-in (`/game`)

Fitur utama aplikasi! Validasi lokasi dan foto pake AI.

#### `POST /check-in` (User)

User melakukan check-in di lokasi.

**Syarat:** Jarak GPS User < 100m & Foto Valid (AI).

**Body JSON:**

```
{
  "hotspotId": "clx_id_gedung_sate",
  "userLat": -6.90225,
  "userLong": 107.61865,
  "imageBase64": "..." // Foto bukti
}
```

**Response Sukses:**

```
{
  "message": "Check-in Berhasil! GGWP!",
  "reward": "+100 EXP",
  "validation": "Lokasi & Foto Valid",
  "imageUrl": "[https://res.cloudinary.com/](https://res.cloudinary.com/)...",
  "newBadge": "Lo dapet badge baru: Langkah Awal!" // (Optional)
}
```

### 👤 5. Profile & History (`/profile`)

#### `GET /history` (User)

Mengambil riwayat check-in user (tempat-tempat yang udah dikunjungi).

### 🏆 6. Gamification (`/badges` & `/leaderboard`)

#### `GET /badges/my` (User)

Mengambil koleksi badge user yang sedang login.

#### `GET /leaderboard` (User)

Melihat Top Player berdasarkan Level dan EXP.

- Query: `?limit=10` (Default 10 besar).

### 🤖 7. AI Generator (`/ai`)

#### `POST /generate-image` (User)

Membuat gambar 2D dari teks prompt (Google Imagen).

**Body:** `{ "prompt": "Candi Borobudur k" }`

### ☁️ 8. General Upload (`/upload`)

Upload gambar umum (misal buat ikon Tarian/Makanan buat ditaruh di JSON Province).

#### `POST /` (User/Admin)

**Body:** `{ "imageBase64": "..." }`
**Response:** `{ "url": "https://res.cloudinary.com/..." }`

## 💡 Catatan Buat Frontend (Flutter)

1. **Format Gambar:**
   - Gunakan library kompresi gambar sebelum convert ke Base64.
   - Resolusi 800x600 atau 1024x768 udah cukup banget buat AI Gemini. Jangan kirim 4K (berat di kuota & server!).
   - Format string base64 bisa mentah atau pakai prefix `data:image/jpg;base64,`.
2. **Data JSON:**
   - Data `iconicInfoJson` dari API Province itu bentuknya **String JSON** .
   - Jangan lupa di-`JSON.parse()` (atau `jsonDecode` di Dart) biar jadi Object/Map yang bisa dibaca.
3. **LBS Logic:**
   - Kirim koordinat user saat ini ke endpoint `/provinces?lat=...&long=...` biar user dapet rekomendasi provinsi terdekat.

**Happy Coding, Tim Rekaloka! Let's win this! 🏆🔥**
