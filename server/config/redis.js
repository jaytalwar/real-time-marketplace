import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
});

redis.on("connect", () => {
    console.log("✅ Redis Connected");
});

redis.on("error", (err) => {
    console.error("Redis Error:", err);
});

export default redis;