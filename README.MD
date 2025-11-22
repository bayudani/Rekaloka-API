
# 🏛️ Backend Rekaloka

Selamat datang di **Backend Service** untuk aplikasi **Rekaloka** . 

Dibangun dengan *stack* modern yang **Sat-Set Wat-Wet** : Node.js, Express, Prisma, MySQL, Redis, dan AI dari Nano Banana & Google Gemini.

## 🚀 Fitur Unggulan

1. **🔐 Autentikasi & Security**
   * Register & Login aman (JWT + BCrypt).
   * Verifikasi Email via OTP (Nodemailer).
   * **RBAC (Role-Based Access Control):** Membedakan hak akses `USER` vs `ADMIN`.
2. **🗺️ Peta Budaya Interaktif (38 Provinsi)**
   * **Smart LBS (Location Based Service):** Otomatis ngurutin provinsi dari yang terdekat dengan user.
   * **Data Hibrid:** Menyimpan info fisik (koordinat GPS) dan info abstrak (Tarian, Makanan, Suku) dalam satu tempat.
3. **🎮 Game Adaptif Lokasi (Mission System)**
   * **Geofencing:** User cuma bisa check-in kalau jaraknya < 100m dari lokasi asli.
   * **AI Referee:** Foto bukti check-in diperiksa sama AI (Gemini Vision). Gak bisa nipu pake foto random!
   * **Leveling:** Dapet EXP, Naik Level, dan Unlock Badge otomatis.
4. **🤖 Generative AI Studio**
   * **Text-to-Image:** Bikin ilustrasi budaya dari teks (pake Nano Banana).
   * **AI Restoration:** Fitur "Perbaiki Foto Rusak" (Image-to-Image).
5. **🏆 Gamification**
   * **Leaderboard:** Papan peringkat para "Sultan Budaya".
   * **Badges:** Koleksi pencapaian (Langkah Awal, Petualang Sejati, dll).

## 🛠️ Tech Stack

* **Core:** Node.js & Express.js (ES Modules)
* **Database:** MySQL (via Prisma ORM)
* **Caching:** Redis (via `ioredis`) — *Biar response API ngebut!*
* **AI Engine:**
  * Nano Banana API (Image Gen & Edit)
  * Google Gemini 2.5 Flash (Vision Validator)
* **Storage:** Cloudinary (Hosting gambar gratis & kenceng)
* **Utils:** `geo.js` (Haversine Formula buat itung jarak GPS)

## 🏃 Cara Setup & Jalanin (Localhost)

Buat yang baru join project, ikutin langkah ini biar gak tersesat:

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
   Buat file `.env` (bisa copy dari `.env.example`). Isi data rahasia lo:

   ```
   PORT=3001
   DATABASE_URL="mysql://user:pass@host:port/db_name"
   JWT_SECRET=""

   # AI Keys
   GOOGLE_API_KEY="dapet_dari_google_ai_studio"
   NANOBANANA_API_KEY="dapet_dari_nanobanana"

   # Storage
   CLOUDINARY_CLOUD_NAME="..."
   CLOUDINARY_API_KEY="..."
   CLOUDINARY_API_SECRET="..."

   # Caching (Pilih salah satu)
   # REDIS_URL="redis://..." (Buat Cloud)
   # REDIS_HOST="127.0.0.1" (Buat Lokal)

   # Email
   MAIL_HOST="smtp.gmail.com"
   MAIL_USER="email@gmail.com"
   MAIL_PASS="app_password_gmail"
   ```
4. **Database Migration (PENTING!):**
   Biar tabel-tabelnya kebuat otomatis di MySQL.

   ```
   npx prisma migrate dev --name init
   ```
5. **Jalanin Server:**

   ```
   npm run dev
   ```

   Gas! Server jalan di: `http://localhost:3001`

## 📖 Dokumentasi API Lengkap

**Base URL:** `http://localhost:3001/api/`

> ⚠️ **PENTING:** Hampir semua endpoint butuh Login.
> `Authorization: Bearer <token_jwt_lo>`

### 🔐 1. Auth (`/auth`)

| Method   | Endpoint      | Deskripsi           | Body JSON                                                    |
| -------- | ------------- | ------------------- | ------------------------------------------------------------ |
| `POST` | `/register` | Daftar akun baru    | `{ "email": "...", "username": "...", "password": "..." }` |
| `POST` | `/verify`   | Verifikasi OTP      | `{ "email": "...", "code": 123456 }`                       |
| `POST` | `/login`    | Masuk & dapet Token | `{ "email": "...", "password": "..." }`                    |

### 👤 2. Profile & History (`/profile`)

| Method  | Endpoint             | Deskripsi                       | Body JSON                                          |
| ------- | -------------------- | ------------------------------- | -------------------------------------------------- |
| `GET` | `/`                | Liat data diri (tanpa password) | -                                                  |
| `PUT` | `/update`          | Ganti Username                  | `{ "username": "Baru" }`                         |
| `PUT` | `/change-password` | Ganti Password                  | `{ "oldPassword": "...", "newPassword": "..." }` |
| `GET` | `/exp-level`       | Cek Level & EXP                 | -                                                  |
| `GET` | `/history`         | **Riwayat Check-in**User  | -                                                  |

### 🗺️ 3. Provinces (`/provinces`)

Data provinsi buat Peta Interaktif.

#### `GET /` (Public)

Ambil list semua provinsi.

* **Mode Biasa:** Tanpa query.
* **Mode LBS (Terdekat):** `?lat=-6.2&long=106.8`

#### `GET /:id` (Public)

Detail lengkap provinsi (termasuk list hotspot & info budaya abstrak).

#### `POST /` (Admin Only)

Tambah provinsi baru.

```
{
  "name": "Jawa Barat",
  "latitude": -6.9175,
  "longitude": 107.6191,
  "description": "...",
  "backsoundUrl": "https://...",
  "iconicInfoJson": "{\"tarian\": [\"Jaipong\"], \"makanan\": [\"Batagor\"]}",
  "logoBase64": "data:image/png;base64,...",
  "backgroundBase64": "data:image/jpeg;base64,..."
}
```

#### `PUT /:id` (Admin Only)

Update data (Partial). Kirim field yang mau diubah aja. Backend otomatis nge-*merge* data JSON.

```
{
  "iconicInfoJson": {
     "makanan": [ { "nama": "Seblak", "imageUrl": "..." } ]
  }
}
```

### 📍 4. Cultural Hotspots (`/hotspots`)

Titik lokasi fisik (Candi, Museum, Warung).

#### `GET /nearby` (Fitur "Sekitar Saya")

Cari tempat wisata di radius user.

* **Query Wajib:** `?lat=...&long=...`
* **Opsional:** `&radius=20` (Default 10km).

#### `GET /by-province/:provinceId`

Ambil semua hotspot di provinsi tertentu.

#### `POST /` (Admin Only)

Tambah lokasi baru.

```
{
  "name": "Gedung Sate",
  "type": "Monumen",
  "latitude": -6.9022,
  "longitude": 107.6186,
  "provinceId": "clx_id_jabar",
  "imageBase64": "data:image/jpeg;base64,..."
}
```

### 🎮 5. Game LBS (`/game`)

#### `POST /check-in` (User)

Misi utama! Validasi lokasi & foto.

**Syarat:** Jarak < 100m & Foto Valid (AI).

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
  "imageUrl": "[https://res.cloudinary.com/](https://res.cloudinary.com/)...",
  "newBadge": "Lo dapet badge baru: Langkah Awal!"
}
```

### 🤖 6. AI Generator (`/ai`)

#### `POST /generate-image` (Text-to-Image)

Bikin gambar baru dari nol.

* **Body:** `{ "prompt": "Candi Borobudur gaya cyberpunk 8k" }`

#### `POST /edit-image` (Image-to-Image) ✨

Restorasi atau edit foto yang diupload.

* **Body:**
  ```
  {
    "prompt": "Restore this broken statue, make it gold",
    "imageBase64": "data:image/jpeg;base64,..."
  }
  ```
* **Response:** Balikin URL foto asli & Base64 foto hasil editan.

### 🏆 7. Gamification

* **`GET /leaderboard`** : Liat Top Player (Level & EXP tertinggi).
* **`GET /badges/my`** : Liat koleksi badge user sendiri.

### ☁️ 8. Utility (`/upload`)

* **`POST /`** : Upload gambar umum (buat ikon tarian/makanan) ke Cloudinary.
* **Body:** `{ "imageBase64": "..." }`
* **Response:** `{ "url": "https://..." }`

## 💡 Catatan Buat Frontend (Flutter)

1. **Format Gambar:**
   * Gunakan library kompresi gambar sebelum convert ke Base64.
   * Resolusi 800x600 atau 1024x768 udah cukup banget buat AI Gemini. Jangan kirim 4K (berat di kuota & server!).
   * Format string base64 bisa mentah atau pakai prefix `data:image/jpg;base64,`.
2. **Data JSON:**
   * Data `iconicInfoJson` dari API Province itu bentuknya **String JSON** .
   * Jangan lupa di-`JSON.parse()` (atau `jsonDecode` di Dart) biar jadi Object/Map yang bisa dibaca.
3. **LBS Logic:**
   * Kirim koordinat user saat ini ke endpoint `/provinces?lat=...&long=...` biar user dapet rekomendasi provinsi terdekat.

**Happy Coding, Tim Rekaloka! Let's win this! 🏆🔥**
