import { db, log, organization, eq, sql } from "@openllm/db";

import { getProject, getOrganization } from "./lib/cache";
import { consumeFromQueue, LOG_QUEUE } from "./lib/redis";

import type { LogInsertData } from "./lib/logs";

const SERVICE_FEE_MULTIPLIER = 1.05;

export async function processLogQueue(): Promise<void> {
	const message = await consumeFromQueue(LOG_QUEUE);

	if (!message) {
		return;
	}

	try {
		const logData = message.map((i) => JSON.parse(i) as LogInsertData);

		const processedLogData = await Promise.all(
			logData.map(async (data) => {
				const organization = await getOrganization(data.organizationId);

				if (organization?.retentionLevel === "none") {
					const {
						messages: _messages,
						content: _content,
						...metadataOnly
					} = data;
					return metadataOnly;
				}

				return data;
			}),
		);

		await db.insert(log).values(processedLogData as any);

		for (const data of logData) {
			if (!data.cost || data.cached) {
				continue;
			}

			const project = await getProject(data.projectId);

			if (project?.mode !== "api-keys") {
				const costWithServiceFee = data.cost * SERVICE_FEE_MULTIPLIER;
				await db
					.update(organization)
					.set({
						credits: sql`${organization.credits} - ${costWithServiceFee}`,
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
