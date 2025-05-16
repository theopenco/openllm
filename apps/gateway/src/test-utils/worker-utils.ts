import redisClient from "../lib/redis";
import { startWorker } from "../worker";

/**
 * Start the log queue worker for testing
 */
export function startWorkerForTests(): void {
	startWorker();
}

/**
 * Stop the Redis client used by the worker
 */
export async function stopWorkerForTests(): Promise<void> {
	// Disconnect the Redis client to stop the worker
	try {
		// Force disconnect with a timeout to prevent hanging
		const quitPromise = redisClient.quit();
		const timeoutPromise = new Promise<void>((resolve) => {
			setTimeout(() => {
				console.log("Redis quit timed out, forcing disconnect");
				resolve();
			}, 1000);
		});

		await Promise.race([quitPromise, timeoutPromise]);

		// Ensure the client is disconnected
		if (redisClient.status !== "end") {
			await redisClient.disconnect();
		}

		console.log("Worker Redis client disconnected for tests");
	} catch (error) {
		console.error("Error disconnecting Redis client:", error);
	}
}
