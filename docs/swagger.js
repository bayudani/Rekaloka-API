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
                email: 'santara.rekaloka@gmail.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3001/api/',
                description: 'Development Server (Local)',
            },
            {
                url: 'https://rekaloka-api.vercel.app/api/', 
                description: 'Production Server (Vercel)',
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
            { name: 'Auth', description: 'Autentikasi User (Login/Register/OTP)' },
            { name: 'Profile', description: 'Manajemen Akun & History & LBS' },
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
                        400: { description: 'Data tidak lengkap' },
                        409: { description: 'Email/Username sudah terdaftar' },
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
                        400: { description: 'Kode salah/expired' },
                    },
                },
            },
            '/auth/resend-otp': { // 🔥 NEW: Endpoint Resend OTP
                post: {
                    tags: ['Auth'],
                    summary: 'Kirim Ulang Kode OTP',
                    description: 'Digunakan jika user tidak menerima kode atau kode expired. Reset kode baru.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email'],
                                    properties: {
                                        email: { type: 'string', example: 'user@example.com' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Kode baru dikirim, cooldown dimulai' },
                        404: { description: 'Email tidak ditemukan' },
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
                        403: { description: 'Akun belum diverifikasi' },
                        404: { description: 'Email/Password salah' },
                    },
                },
            },

            // --- PROFILE ---
            '/profile': {
                get: {
                    tags: ['Profile'],
                    summary: 'Ambil data diri user',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Data user berhasil diambil' },
                    },
                },
            },
            '/profile/detect-province': { // 🔥 NEW: Endpoint Detect Location
                get: {
                    tags: ['Profile'],
                    summary: 'Deteksi Provinsi User (Reverse Geocoding)',
                    description: 'Menebak provinsi user berdasarkan Lat/Long menggunakan Nominatim & DB.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: 'query', name: 'lat', required: true, schema: { type: 'number' }, description: '-6.200' },
                        { in: 'query', name: 'long', required: true, schema: { type: 'number' }, description: '106.816' },
                    ],
                    responses: {
                        200: { description: 'Provinsi ditemukan' },
                        404: { description: 'Lokasi tidak terdeteksi' },
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
                                    properties: { username: { type: 'string' } },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Sukses update' } },
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
                    responses: { 200: { description: 'Sukses ganti password' } },
                },
            },
            '/profile/exp-level': {
                get: {
                    tags: ['Profile'],
                    summary: 'Cek Level & EXP User',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Info Level berhasil diambil' } },
                },
            },
            '/profile/history': {
                get: {
                    tags: ['Profile'],
                    summary: 'Riwayat Check-in User',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List history check-in' } },
                },
            },

            // --- PROVINCES ---
            '/provinces': {
                get: {
                    tags: ['Provinces'],
                    summary: 'Ambil semua provinsi (Support LBS)',
                    parameters: [
                        { in: 'query', name: 'lat', schema: { type: 'number' } },
                        { in: 'query', name: 'long', schema: { type: 'number' } },
                    ],
                    responses: { 200: { description: 'List provinsi' } },
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
                                        backsoundBase64: { type: 'string', description: 'Base64 Audio MP3' },
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        logoBase64: { type: 'string' },
                                        backgroundBase64: { type: 'string' },
                                        iconicInfoJson: { type: 'object' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: 'Created' } },
                },
            },
            '/provinces/{id}': {
                get: {
                    tags: ['Provinces'],
                    summary: 'Detail Provinsi',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Detail provinsi' } },
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
                                    properties: { description: { type: 'string' } },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Updated' } },
                },
                delete: {
                    tags: ['Provinces'],
                    summary: 'Hapus Provinsi (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Deleted' } },
                },
            },

            // --- HOTSPOTS ---
            '/hotspots': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Ambil Semua Hotspot',
                    responses: { 200: { description: 'List hotspot' } },
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
                    responses: { 201: { description: 'Created' } },
                },
            },
            '/hotspots/nearby': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Cari Hotspot Sekitar (LBS)',
                    parameters: [
                        { in: 'query', name: 'lat', required: true, schema: { type: 'number' } },
                        { in: 'query', name: 'long', required: true, schema: { type: 'number' } },
                        { in: 'query', name: 'radius', schema: { type: 'number', default: 10 } },
                    ],
                    responses: { 200: { description: 'List hotspot terdekat' } },
                },
            },
            '/hotspots/by-province/{provinceId}': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Ambil Hotspot per Provinsi',
                    parameters: [{ in: 'path', name: 'provinceId', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'List hotspot' } },
                },
            },
            '/hotspots/{id}': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Detail Hotspot',
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Detail hotspot' } },
                },
                put: {
                    tags: ['Hotspots'],
                    summary: 'Update Hotspot (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Updated' } },
                },
                delete: {
                    tags: ['Hotspots'],
                    summary: 'Hapus Hotspot (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Deleted' } },
                },
            },

            // --- GAME ---
            '/game/check-in': {
                post: {
                    tags: ['Game'],
                    summary: 'Check-in Lokasi (Main Game)',
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
                                        imageBase64: { type: 'string', description: 'Foto bukti' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Check-in Valid! Dapet EXP.' },
                        400: { description: 'Kejauhan/Foto Salah' },
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
                    responses: { 200: { description: 'Image Generated' } },
                },
            },
            '/ai/edit-image': {
                post: {
                    tags: ['AI'],
                    summary: 'Image to Image (Restorasi)',
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
                    responses: { 200: { description: 'Image Edited' } },
                },
            },

            // --- BADGES ---
            '/badges/my': {
                get: {
                    tags: ['Badges'],
                    summary: 'Liat Badge Saya (Locked & Unlocked)',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List badge user dengan status unlocked' } },
                },
            },
            '/badges/{userId}': {
                get: {
                    tags: ['Badges'],
                    summary: 'Liat Badge User Lain',
                    parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'List badge user lain' } },
                },
            },

            // --- LEADERBOARD ---
            '/leaderboard': {
                get: {
                    tags: ['Leaderboard'],
                    summary: 'Top User Rank',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: 'query', name: 'limit', schema: { type: 'number' } }],
                    responses: { 200: { description: 'List ranking' } },
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
                    responses: { 200: { description: 'URL gambar' } },
                },
            },
        },
    },
    apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;