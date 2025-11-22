import Redis from 'ioredis';

let redis;

if (process.env.REDIS_URL) {
    console.log('🔗 Menghubungkan ke Redis Cloud...');
    redis = new Redis(process.env.REDIS_URL);
} else {
    console.log('🔗 Menghubungkan ke Redis Lokal...');
    redis = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    });
}

redis.on('connect', () => {
    console.log('✅ Terhubung ke Redis!');
});

redis.on('error', (err) => {
    console.error('❌ Redis Error:', err);
});

export default redis;