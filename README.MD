## 📖 Dokumentasi API (Sementara)

Semua *endpoint* ada di bawah  *base URL* : `/api/v1`

### 1. Auth (`/api/auth`)

#### `POST /register`

Mendaftarkan user baru dan mengirim email verifikasi.
*Body:* `{ "email": "...", "username": "...", "password": "..." }`

#### `POST /verify`

Memverifikasi akun user pake kode dari email.
*Body:* `{ "email": "...", "code": 123456 }`

#### `POST /login`

Login dan dapet JWT Token.
*Body:* `{ "email": "...", "password": "..." }`

### 2. AI (`/api/ai`)

#### `POST /generate-image`

Membuat gambar 2D dari *prompt* teks.
**Header:** `Authorization: Bearer <token>`
*Body:* `{ "prompt": "Candi Borobudur" }`

### 3. Provinces (`/api/provinces`)

#### `GET /`

Mengambil daftar semua provinsi.

#### `GET /:id`

Mengambil detail satu provinsi (termasuk info ikonik & list hotspot).

#### `POST /` (Admin)

Membuat data provinsi baru (termasuk data budaya abstrak di `iconicInfoJson`).
**Header:** `Authorization: Bearer <token>`

### 4. Cultural Hotspots (`/api/hotspots`)

#### `GET /by-province/:provinceId`

Mengambil semua hotspot di provinsi tertentu (buat nampilin pin di peta).

#### `POST /` (Admin)

Menambahkan titik lokasi budaya fisik (Museum, Candi, dll).
**Header:** `Authorization: Bearer <token>`
*Body:* `{ "name": "...", "latitude": -6.xxx, "longitude": 107.xxx, ... }`

### 5. Game Adaptif Lokasi (`/api/game`) 

Fitur ini ngecek apakah user beneran ada di lokasi DAN motret objek yang bener.

#### `POST /check-in`

Melakukan check-in, validasi lokasi, validasi foto, dan klaim EXP.

**Header Wajib:** `Authorization: Bearer <token_dari_login>`

**Body (JSON):**

```
{
  "hotspotId": "clx_id_candi_borobudur",   // ID tempat user mau check-in
  "userLat": -7.6079,                       // Koordinat GPS User saat ini
  "userLong": 110.2038,                     // Koordinat GPS User saat ini
  "imageBase64": "/9j/4AAQSkZJRgABA..."    // Foto lokasi yang diambil user (Base64 string)
}
```

**Respon Sukses (200):**

```
{
  "message": "Check-in Berhasil! GGWP!",
  "reward": "+100 EXP",
  "validation": "Lokasi & Foto Valid"
}
```

**Respon Gagal (400):**

* *"Kejauhan, bro! Lo berjarak 500m dari lokasi..."* (User bohong lokasi)
* *"AI gagal mengenali tempat ini..."* (Foto buram/gelap/salah objek)
* *"Lo udah pernah check-in di sini..."* (Spam check-in)
