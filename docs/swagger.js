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
                url: 'https://rekaloka-api2.vercel.app/api/',
                description: 'Development Server',
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
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: 'Auth', description: 'Autentikasi User' },
            { name: 'Profile', description: 'Profil & History User' },
            { name: 'Provinces', description: 'Data Provinsi & Peta' },
            { name: 'Hotspots', description: 'Titik Lokasi Budaya' },
            { name: 'Game', description: 'Fitur Check-in & LBS' },
            { name: 'AI', description: 'Generator & Edit Gambar' },
            { name: 'Leaderboard', description: 'Papan Peringkat' },
            { name: 'Upload', description: 'Utility Upload Gambar' },
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
                        409: { description: 'Email/Username sudah ada' },
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
                        400: { description: 'Kode salah' },
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
                        401: { description: 'Password salah' },
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
                        200: { description: 'Data user (tanpa password)' },
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
                                    properties: {
                                        username: { type: 'string', example: 'SultanBaru' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Sukses update' } },
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
                        { in: 'query', name: 'lat', schema: { type: 'number' }, description: 'Latitude User' },
                        { in: 'query', name: 'long', schema: { type: 'number' }, description: 'Longitude User' },
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
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        logoBase64: { type: 'string', description: 'Base64 Image' },
                                        backgroundBase64: { type: 'string', description: 'Base64 Image' },
                                        iconicInfoJson: { type: 'object', description: 'JSON Data Tarian/Makanan' },
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
                    responses: { 200: { description: 'Detail data' } },
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
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Updated' } },
                },
            },

            // --- HOTSPOTS ---
            '/hotspots/nearby': {
                get: {
                    tags: ['Hotspots'],
                    summary: 'Cari Hotspot Sekitar (LBS)',
                    parameters: [
                        { in: 'query', name: 'lat', required: true, schema: { type: 'number' } },
                        { in: 'query', name: 'long', required: true, schema: { type: 'number' } },
                        { in: 'query', name: 'radius', schema: { type: 'number', default: 10 }, description: 'Radius KM' },
                    ],
                    responses: { 200: { description: 'List hotspot terdekat' } },
                },
            },
            '/hotspots': {
                post: {
                    tags: ['Hotspots'],
                    summary: 'Tambah Hotspot (Admin Only)',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
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
                                        imageBase64: { type: 'string', description: 'Foto bukti check-in' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Check-in Valid! Dapet EXP.' },
                        400: { description: 'Kejauhan atau Foto Salah' },
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
                                    properties: { prompt: { type: 'string' } },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Base64 Image' } },
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
                                    properties: {
                                        prompt: { type: 'string' },
                                        imageBase64: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 200: { description: 'Edited Image Base64' } },
                },
            },

            // --- LEADERBOARD ---
            '/leaderboard': {
                get: {
                    tags: ['Leaderboard'],
                    summary: 'Top User Rank',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List user ranking' } },
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
    apis: [], // Kita gak pake file lain, semua definisi ada di sini
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;