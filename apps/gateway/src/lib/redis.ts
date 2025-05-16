import Redis from "ioredis";

const redisClient = new Redis({
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6379,
});

redisClient.on("error", (err: Error) =>
	console.error("Redis Client Error", err),
);

export const LOG_QUEUE = "log_queue";

export async function publishToQueue(
	queue: string,
	message: unknown,
): Promise<void> {
	try {
		await redisClient.rpush(queue, JSON.stringify(message));
	} catch (error) {
		console.error("Error publishing to queue:", error);
		throw error;
	}
}

export async function consumeFromQueue(queue: string): Promise<string | null> {
	try {
		const result = await redisClient.rpop(queue, 0);

		if (!result) {
			return null;
		}

		return result[1];
	} catch (error) {
		console.error("Error consuming from queue:", error);
		throw error;
	}
}

export default redisClient;
