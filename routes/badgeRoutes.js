import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Rekaloka API Documentation',
            version: '1.0.0',
            description: 'Dokumentasi resmi Backend Rekaloka untuk lomba BudayaGO. Platform Edukasi dan Game LBS Budaya Indonesia.',
            contact: {
                name: 'Tim Rekaloka',
                email: 'dev@rekaloka.id',
            },
        },
        servers: [
            {
                url: 'http://localhost:3001/api/v1',
                description: 'Development Server',
            },
            {
                url: 'https://rekaloka-api.vercel.app/api/v1', // Ganti sama URL Vercel lo
                description: 'Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Deskripsi error yang terjadi.' },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operasi berhasil.' },
                        data: { type: 'object' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: 'Auth', description: 'Autentikasi User (Login/Register)' },
            { name: 'Profile', description: 'Manajemen Akun & History' },
            { name: 'Provinces', description: 'Data Provinsi & Peta Interaktif' },
            { name: 'Hotspots', description: 'Titik Lokasi Budaya (Museum/Candi)' },
            { name: 'Game', description: 'Gameplay Check-in & LBS' },
            { name: 'AI', description: 'Generator & Edit Gambar (Nano Banana)' },
            { name: 'Leaderboard', description: 'Papan Peringkat Player' },
            { name: 'Upload', description: 'Utility Upload ke Cloudinary' },
            { name: 'Badges', description: 'Koleksi Pencapaian User' },
        ],
        paths: {
            // --- AUTH ---
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Daftar user baru',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'username', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'user@example.com' },
                                        username: { type: 'string', example: 'budayawan123' },
                                        password: { type: 'string', example: 'rahasia123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Registrasi berhasil, cek email OTP' },
                        400: { description: 'Data tidak lengkap (Email/Username/Password kosong)' },
                        409: { description: 'Email atau Username sudah terdaftar' },
                        500: { description: 'Server error saat register' },
                    },
                },
            },
            '/auth/verify': {
                post: {
                    tags: ['Auth'],
                    summary: 'Verifikasi OTP Email',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'code'],
                                    properties: {
                                        email: { type: 'string', example: 'user@example.com' },
                                        code: { type: 'integer', example: 123456 },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Akun terverifikasi' },
                        400: { description: 'Kode salah atau email tidak valid' },
                        404: { description: 'User tidak ditemukan' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login User',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'user@example.com' },
                                        password: { type: 'string', example: 'rahasia123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Login sukses, dapet token' },
                        400: { description: 'Email/Password kosong' },
                        403: { description: 'Akun belum diverifikasi' },
                        404: { description: 'Email atau password salah' },
                    },
                },
            },

            // --- PROFILE ---
            '/profile': {
                get: {
                    tags: ['Profile'],
                    summary: 'Ambil data diri user (tanpa password)',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Data user berhasil diambil' },
                        401: { description: 'Token tidak ada/expired' },
                        404: { description: 'User tidak ditemukan' },
                    },
                },
            },
            '/profile/update': {
                put: {
                    tags: ['Profile'],
                    summary: 'Update Username',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['username'],
                                    properties: {
                                        username: { type: 'string', example: 'SultanBaru' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Sukses update profil' },
                        400: { description: 'Username kosong' },
                        409: { description: 'Username sudah dipakai orang lain' },
                    },
                },
            },
            '/profile/change-password': {
                put: {
                    tags: ['Profile'],
                    summary: 'Ganti Password',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['oldPassword', 'newPassword'],
                                    properties: {
                                        oldPassword: { type: 'string' },
                                        newPassword: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Sukses ganti password' },
                        400: { description: 'Password baru kurang dari 6 karakter' },
                        401: { description: 'Password lama salah' },
                    },
                },
            },
            '/profile/exp-level': {
                get: {
                    tags: ['Profile'],
                    summary: 'Cek Level & EXP User',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Info Level & EXP berhasil diambil' },
                    },
                },
            },
            '/profile/history': {
                get: {
                    tags: ['Profile'],
                    summary: 'Riwayat Check-in User',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'List tempat yang dikunjungi' },
                    },
                },
            },

            // --- PROVINCES ---
            '/provinces': {
                get: {
                    tags: ['Provinces'],
                    summary: 'Ambil semua provinsi (Support LBS)',
                    description: 'Ambil semua provinsi. Gunakan query lat & long untuk sorting berdasarkan jarak terdekat.',
                    parameters: [
                        { in: 'query', name: 'lat', schema: { type: 'number' }, description: 'Latitude User (Optional)' },
                        { in: 'query', name: 'long', schema: { type: 'number' }, description: 'Longitude User (Optional)' },
                    ],
                    responses: {
                        200: { description: 'List provinsi berhasil diambil' },
                        500: { description: 'Server error saat ambil data' },
                    },
                },
                post: {
                    tags: ['Provinces'],
                    summary: 'Tambah Provinsi (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'description'],
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        backsoundUrl: { type: 'string' },
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        logoBase64: { type: 'string' },
                                        backgroundBase64: { type: 'string' },
                                        iconicInfoJson: { type: 'object', description: 'Object JSON (Tarian, Makanan)' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Created successfully' },
                        400: { description: 'Nama/Deskripsi kosong' },
                        403: { description: 'Forbidden: Bukan Admin' },
                        409: { description: 'Nama provinsi sudah ada' },
                    },
                },
            },
            '/provinces/{id}': {
                get: {
                    tags: ['Provinces'],
                    summary: 'Detail Provinsi',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Detail lengkap provinsi' },
                        404: { description: 'Provinsi tidak ditemukan' },
                    },
                },
                put: {
                    tags: ['Provinces'],
                    summary: 'Update Provinsi (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        description: { type: 'string' },
                                        iconicInfoJson: { type: 'object' },
                                        // ... field lain optional
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Updated successfully' },
                        403: { description: 'Forbidden: Bukan Admin' },
                        404: { description: 'Provinsi tidak ditemukan' },
                    },
                },
                delete: {
                    tags: ['Provinces'],
                    summary: 'Hapus Provinsi (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Deleted successfully' },
                        403: { description: 'Forbidden: Bukan Admin' },
                        404: { description: 'Provinsi tidak ditemukan' },
                    },
                },
            },

            // --- HOTSPOTS ---
            '/hotspots': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Ambil Semua Hotspot',
                    responses: { 200: { description: 'List semua hotspot' } },
                },
                post: {
                    tags: ['Hotspots'],
                    summary: 'Tambah Hotspot (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'latitude', 'longitude', 'type', 'provinceId'],
                                    properties: {
                                        name: { type: 'string' },
                                        type: { type: 'string' },
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        provinceId: { type: 'string' },
                                        imageBase64: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Created successfully' },
                        400: { description: 'Data tidak lengkap' },
                        403: { description: 'Forbidden: Bukan Admin' },
                        404: { description: 'ID Provinsi tidak valid' },
                    },
                },
            },
            '/hotspots/nearby': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Cari Hotspot Sekitar (LBS)',
                    description: 'Fitur "Budaya Terkait dari Lokasimu". Mencari hotspot dalam radius tertentu.',
                    parameters: [
                        { in: 'query', name: 'lat', required: true, schema: { type: 'number' }, description: 'Lat User' },
                        { in: 'query', name: 'long', required: true, schema: { type: 'number' }, description: 'Long User' },
                        { in: 'query', name: 'radius', schema: { type: 'number', default: 10 }, description: 'Radius KM' },
                    ],
                    responses: {
                        200: { description: 'List hotspot terdekat' },
                        400: { description: 'Lat/Long tidak ada atau format salah' },
                    },
                },
            },
            '/hotspots/by-province/{provinceId}': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Ambil Hotspot per Provinsi',
                    parameters: [{ in: 'path', name: 'provinceId', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'List hotspot di provinsi tersebut' },
                        404: { description: 'Provinsi tidak ditemukan' },
                    },
                },
            },
            '/hotspots/{id}': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Detail Hotspot',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Detail hotspot' },
                        404: { description: 'Hotspot tidak ditemukan' },
                    },
                },
                put: {
                    tags: ['Hotspots'],
                    summary: 'Update Hotspot (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { name: { type: 'string' }, description: { type: 'string' } },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Updated successfully' },
                        403: { description: 'Forbidden: Bukan Admin' },
                        404: { description: 'Hotspot tidak ditemukan' },
                    },
                },
                delete: {
                    tags: ['Hotspots'],
                    summary: 'Hapus Hotspot (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Deleted successfully' },
                        403: { description: 'Forbidden: Bukan Admin' },
                        404: { description: 'Hotspot tidak ditemukan' },
                    },
                },
            },

            // --- GAME ---
            '/game/check-in': {
                post: {
                    tags: ['Game'],
                    summary: 'Check-in Lokasi (Main Game)',
                    description: 'Validasi LBS (<100m) dan AI Vision.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['hotspotId', 'userLat', 'userLong', 'imageBase64'],
                                    properties: {
                                        hotspotId: { type: 'string' },
                                        userLat: { type: 'number' },
                                        userLong: { type: 'number' },
                                        imageBase64: { type: 'string', description: 'Foto bukti check-in' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Check-in Valid! Dapet EXP.' },
                        400: { description: 'Kejauhan, Foto Salah, atau Data Gak Lengkap' },
                        404: { description: 'Lokasi hotspot tidak ditemukan' },
                    },
                },
            },

            // --- AI ---
            '/ai/generate-image': {
                post: {
                    tags: ['AI'],
                    summary: 'Text to Image Generator',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['prompt'],
                                    properties: { prompt: { type: 'string' } },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Base64 Image berhasil digenerate' },
                        400: { description: 'Prompt kosong' },
                        500: { description: 'Gagal generate gambar (AI Error)' },
                    },
                },
            },
            '/ai/edit-image': {
                post: {
                    tags: ['AI'],
                    summary: 'Image to Image (Restorasi/Edit)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['prompt', 'imageBase64'],
                                    properties: {
                                        prompt: { type: 'string' },
                                        imageBase64: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Edited Image Base64' },
                        400: { description: 'Prompt/Image kosong' },
                        500: { description: 'Gagal edit gambar' },
                    },
                },
            },

            // --- BADGES ---
            '/badges/my': {
                get: {
                    tags: ['Badges'],
                    summary: 'Liat Badge Saya',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'List badge user' },
                    },
                },
            },
            '/badges/{userId}': {
                get: {
                    tags: ['Badges'],
                    summary: 'Liat Badge User Lain',
                    parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'List badge user lain' },
                    },
                },
            },

            // --- LEADERBOARD ---
            '/leaderboard': {
                get: {
                    tags: ['Leaderboard'],
                    summary: 'Top User Rank',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'query', name: 'limit', schema: { type: 'number' } }],
                    responses: {
                        200: { description: 'List user ranking' },
                    },
                },
            },

            // --- UPLOAD ---
            '/upload': {
                post: {
                    tags: ['Upload'],
                    summary: 'Upload gambar umum ke Cloudinary',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['imageBase64'],
                                    properties: {
                                        imageBase64: { type: 'string' },
                                        folder: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'URL gambar' },
                        400: { description: 'Image Base64 kosong' },
                        500: { description: 'Gagal upload ke Cloudinary' },
                    },
                },
            },
        },
    },
    apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;