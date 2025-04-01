import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()

export const redis = new Redis(process.env.REDIS_URI);
await redis.set('foo', 'bar');