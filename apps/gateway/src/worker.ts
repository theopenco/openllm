import { db, log, organization, eq, sql } from "@openllm/db";

import { getProject } from "./lib/cache";
import { consumeFromQueue, LOG_QUEUE } from "./lib/redis";

import type { LogInsertData } from "./lib/logs";

export async function processLogQueue(): Promise<void> {
	const message = await consumeFromQueue(LOG_QUEUE);

	if (!message) {
		return;
	}

	try {
		const logData = message.map((i) => JSON.parse(i) as LogInsertData);

		await db.insert(log).values(
			logData.map((i) => {
				if (i.hasError === undefined) {
					i.hasError = false;
				}
				if (i.estimatedCost === undefined) {
					i.estimatedCost = false;
				}
				if (i.canceled === undefined) {
					i.canceled = false;
				}
				if (i.streamed === undefined) {
					i.streamed = false;
				}
				if (i.cached === undefined) {
					i.cached = false;
				}
				if (i.mode === undefined) {
					i.mode = "api-keys";
				}
				if (i.usedMode === undefined) {
					i.usedMode = "api-keys";
				}

				return {
					createdAt: new Date(),
					...i,
				};
			}),
		);

		for (const data of logData) {
			if (!data.cost || data.cached) {
				continue;
			}

			const project = await getProject(data.projectId);

			if (project?.mode !== "api-keys") {
				await db
					.update(organization)
					.set({
						credits: sql`${organization.credits} - ${data.cost}`,
					})
					.where(eq(organization.id, data.organizationId));
			}
		}
	} catch (error) {
		console.error("Error processing log message:", error);
	}
}

export async function startWorker() {
	console.log("Starting log queue worker...");
	while (true) {
		try {
			await processLogQueue();
			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});
		} catch (error) {
			console.error("Error starting log queue worker:", error);
		}
	}
}

void startWorker();
