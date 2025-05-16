import { db, log } from "@openllm/db";

import { consumeFromQueue, LOG_QUEUE } from "./lib/redis";

import type { LogInsertData } from "./lib/logs";

async function processLogQueue(): Promise<void> {
	try {
		const message = await consumeFromQueue(LOG_QUEUE);

		if (!message) {
			return;
		}

		try {
			const logData = JSON.parse(message) as LogInsertData;

			await db.insert(log).values({
				createdAt: new Date(),
				updatedAt: new Date(),
				...logData,
			});

			console.log("Log inserted successfully");
		} catch (error) {
			console.error("Error processing log message:", error);
		}

		setImmediate(() => processLogQueue());
	} catch (error) {
		console.error("Error in queue consumer:", error);
		setTimeout(() => processLogQueue(), 5000);
	}
}

export function startWorker(): void {
	console.log("Starting log queue worker...");
	void processLogQueue();
}

startWorker();
