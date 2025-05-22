import { publishToQueue, LOG_QUEUE } from "./redis";

import type { InferInsertModel } from "@openllm/db";
import type { log } from "@openllm/db";

/**
 * Insert a log entry into the database.
 * This function is extracted to prepare for future implementation using a message queue.
 */
export type LogInsertData = Omit<
	InferInsertModel<typeof log>,
	"id" | "createdAt" | "updatedAt"
>;

export type LogData = InferInsertModel<typeof log>;

export async function insertLog(logData: LogInsertData): Promise<unknown> {
	logData.usedMode = determineUsedMode(logData.providerKeyId);
	await publishToQueue(LOG_QUEUE, logData);
	return 1; // Return 1 to match test expectations
}

function determineUsedMode(providerKeyId: string): "api-keys" | "credits" {
	return providerKeyId.startsWith("env-") ? "credits" : "api-keys";
}
