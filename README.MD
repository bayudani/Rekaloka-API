## 📖 Dokumentasi API (Sementara)

Semua *endpoint* ada di bawah  *base URL* : `/api/v1`

### 1. Auth (`/api/v1/auth`)

#### `POST /register`

Mendaftarkan user baru dan mengirim email verifikasi.

*Body (JSON):*

```
{
  "email": "user@email.com",
  "username": "userkeren",
  "password": "password123"
}
```

#### `POST /verify`

Memverifikasi akun user pake kode dari email.

*Body (JSON):*

```
{
  "email": "user@email.com",
  "code": 123456
}
```

#### `POST /login`

Login ke akun yang udah terverifikasi dan dapet JWT Token.

*Body (JSON):*

```
{
  "email": "user@email.com",
  "password": "password123"
}
```

*Respon Sukses:*

```
{
  "message": "Login berhasil!",
  "token": "eyJhbGciOiJIUz... (token lo)",
  "user": {
    "id": "cl...",
    "email": "user@email.com",
    "username": "userkeren",
    "is_verify": true,
    "exp": 0
    // ... data user lainnya
  }
}
```

### 2. AI (`/api/v1/ai`)

#### `POST /generate-image`

Membuat gambar 2D dari *prompt* teks.
**(NOTE: Nanti endpoint ini harus diproteksi pake JWT Middleware!)**

*Body (JSON):*

```
{
  "prompt": "Candi Borobudur di malam hari, gaya lukisan van gogh",
  "userId": "cl..." // (Sementara masih pake userId, nanti ganti pake token)
}
```

*Respon Sukses:*

```
{
  "message": "Gambar 2D berhasil dibuat",
  "imageUrl": "data:image/png;base64,iVBORw0KGgo..."
}
```

### 3. Provinces (`/api/v1/provinces`)

#### `GET /`

Mengambil daftar semua provinsi.

#### `GET /:id`

Mengambil detail satu provinsi, termasuk daftar  *cultural hotspots* -nya.

*Contoh:* `/api/v1/provinces/clx123abc`
