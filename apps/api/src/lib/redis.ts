import Redis from "ioredis";

const redisClient = new Redis({
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6379,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export default redisClient;
