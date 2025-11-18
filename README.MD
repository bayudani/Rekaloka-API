
## 🚀 Fitur Utama

1. **Autentikasi Modern:**
   * Register & Login aman (JWT + BCrypt).
   * Verifikasi Email (OTP via Nodemailer).
2. **Eksplorasi Peta Budaya (38 Provinsi):**
   * Data detail tiap provinsi (Deskripsi, Logo, Background).
   * Info budaya "abstrak" (Tari, Suku, Bahasa) via JSON.
   * Info budaya "fisik" (Candi, Museum) via titik koordinat GPS.
3. **Game Adaptif Lokasi (LBS):**
   * **Check-in System:** Validasi User harus berada di radius < 100m dari lokasi.
   * **AI Vision Validation:** Foto bukti check-in divalidasi otomatis oleh **Google Gemini** (Beneran foto Candi gak?).
   * **Cloud Upload:** Bukti foto otomatis di-upload ke  **Cloudinary** .
   * **Leveling System:** Dapet EXP tiap check-in, Level user naik otomatis.
4. **Gamification (Badges):**
   * Sistem **Badge Otomatis** (Trigger saat check-in).
   * Contoh: *"Langkah Awal"* (First check-in), *"Warga Lokal"* (Level 5).
5. **AI Text-to-Image:**
   * Generate konsep gambar budaya 2D pake  **Google Imagen 4.0** .

## 🛠️ Tech Stack & Tools

* **Core:** Node.js, Express.js (ES Modules)
* **Database:** MySQL (via Prisma ORM)
* **Auth:** `jsonwebtoken` (JWT), `bcrypt`
* **Email:** `nodemailer`
* **AI Engine:**
  * Google Gemini 1.5 Flash (Vision/Image Analysis)
  * Google Imagen 4.0 (Image Generation)
* **Storage:** Cloudinary (Upload gambar gratis & kenceng)
* **Utils:** `geo.js` (Haversine Formula buat jarak GPS)


## 📖 Dokumentasi API Lengkap (v1)

Base URL: `http://localhost:3001/api/v1`

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

Mengambil semua data provinsi (buat list menu/peta utama).

#### `GET /:id`

Detail lengkap provinsi termasuk `hotspots` (titik lokasi) dan `iconicInfo` (budaya abstrak).

#### `POST /` (Admin/Protected)

Membuat provinsi baru dengan aset visual.

**Body JSON:**

```
{
  "name": "Jawa Barat",
  "description": "Provinsi dengan kearifan lokal Sunda yang kental...",
  "backsoundUrl": "[https://link-lagu-daerah.mp3](https://link-lagu-daerah.mp3)",
  "iconicInfoJson": "{\"tarian\": [\"Jaipong\"], \"makanan\": [\"Batagor\"]}",
  "logoBase64": "data:image/png;base64,iVBORw0KGgo...",       // <-- Upload Logo
  "backgroundBase64": "data:image/jpeg;base64,/9j/4AAQSk..."  // <-- Upload Background
}
```

#### `PUT /:id` (Admin/Protected)

Update data provinsi. Kirim field yang mau diubah saja.

**Body JSON (Contoh ganti deskripsi & logo):**

```
{
  "description": "Update deskripsi baru...",
  "logoBase64": "data:image/png;base64,iVBORw0KGgo..." // Kalau field ini dikirim, logo lama bakal keganti
}
```

#### `DELETE /:id` (Admin/Protected)

Hapus data provinsi.

### 📍 3. Cultural Hotspots (`/hotspots`)

Titik lokasi fisik (Candi, Museum, Warung) yang ada di peta.

#### `GET /by-province/:provinceId`

Mengambil semua hotspot di provinsi tertentu.

#### `GET /:id`

Mengambil detail satu hotspot.

#### `POST /` (Admin/Protected)

Menambah lokasi baru beserta fotonya.

**Body JSON:**

```
{
  "name": "Gedung Sate",
  "description": "Ikon kota Bandung...",
  "type": "Monumen",
  "latitude": -6.9022,
  "longitude": 107.6186,
  "provinceId": "clx_id_jawa_barat",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSk..." // <-- Foto Lokasi
}
```

#### `PUT /:id` (Admin/Protected)

Update data hotspot. Kirim field yang mau diubah saja.

**Body JSON (Contoh ganti foto & nama):**

```
{
  "name": "Gedung Sate (Renovasi)",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSk..." // Foto baru akan diupload ke Cloudinary
}
```

#### `DELETE /:id` (Admin/Protected)

Hapus data hotspot.

### 🎮 4. Game LBS & Check-in (`/game`)

Fitur utama aplikasi! Validasi lokasi dan foto pake AI.

#### `POST /check-in` (User/Protected)

User melakukan check-in di lokasi.

**Syarat:**

1. Jarak GPS User < 100m dari lokasi Hotspot.
2. Foto yang diupload valid (dikenali AI sebagai lokasi tersebut).

**Body JSON:**

```
{
  "hotspotId": "clx_id_gedung_sate", // ID tempat tujuan
  "userLat": -6.90225,               // GPS User (harus deket)
  "userLong": 107.61865,             // GPS User
  "imageBase64": "/9j/4AAQSk..."     // Foto bukti (Base64 string)
}
```

**Response Sukses (200):**

```
{
  "message": "Check-in Berhasil! GGWP!",
  "reward": "+100 EXP",
  "validation": "Lokasi & Foto Valid",
  "imageUrl": "[https://res.cloudinary.com/](https://res.cloudinary.com/)...", // URL bukti di cloud
  "newBadge": "Lo dapet badge baru: Langkah Awal!" // (Opsional, jika dapet)
}
```

**Response Gagal (400):**

* *"Kejauhan, bro!"* -> GPS kejauhan.
* *"AI gagal mengenali tempat ini."* -> Foto buram/salah objek.

### 🏆 5. Badges & Profil (`/badges`)

#### `GET /my` (User/Protected)

Mengambil daftar badge yang sudah didapatkan oleh user yang sedang login.

**Response:**

```
[
  {
    "name": "Langkah Awal",
    "description": "Check-in pertama kali.",
    "iconUrl": "[https://cdn-icons-png.flaticon.com/](https://cdn-icons-png.flaticon.com/)...",
    "createdAt": "2024-05-20T..."
  }
]
```

### 🤖 6. AI Generator (`/ai`)

#### `POST /generate-image` (User/Protected)

Membuat gambar 2D dari teks prompt (Google Imagen).

**Body:**

```
{ "prompt": "Rumah Gadang futuristik style cyberpunk" }
```

### ☁️ 7. General Upload (`/upload`)

Upload gambar umum (misal buat ikon Tarian, Makanan, dll) ke Cloudinary.

#### `POST /` (User/Protected)

**Body JSON:**

```
{
  "imageBase64": "data:image/png;base64,iVBOR...",
  "folder": "rekaloka_general" // (Opsional)
}
```

**Response:**

```
{
  "message": "Upload berhasil",
  "url": "[https://res.cloudinary.com/](https://res.cloudinary.com/)..." // Gunakan URL ini di JSON Provinsi
}
```

## 💡 Catatan Buat Frontend (Flutter)

1. **Upload Gambar:**
   * Gunakan library kompresi gambar sebelum convert ke Base64.
   * Resolusi 800x600 atau 1024x768 udah cukup banget buat AI Gemini. Jangan kirim 4K (berat!).
   * Format string base64 bisa mentah atau pakai prefix `data:image/jpg;base64,` (Backend nerima dua-duanya).
2. **Iconic Info (JSON):**
   * Data `iconicInfoJson` dari API Province itu bentuknya  **String** .
   * Jangan lupa di-`JSON.parse()` (atau `jsonDecode` di Dart) biar jadi Object/Map yang bisa dibaca.
   * Gunakan endpoint `/upload` dulu buat dapetin URL gambar tarian/makanan, baru masukin URL-nya ke sini.
3. **Cloudinary:**
   * Semua gambar (Logo, Background, Bukti Check-in) sekarang di-host di Cloudinary. URL-nya aman dan HTTPS.
