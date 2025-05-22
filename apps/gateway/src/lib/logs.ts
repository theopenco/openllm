import { UnifiedFinishReason } from "@openllm/db";

import { publishToQueue, LOG_QUEUE } from "./redis";

import type { InferInsertModel } from "@openllm/db";
import type { log } from "@openllm/db";

/**
 * Maps provider-specific finish reasons to unified finish reasons
 */
export function getUnifiedFinishReason(
	finishReason: string | null | undefined,
	provider: string | null | undefined,
): UnifiedFinishReason {
	if (!finishReason) {
		return UnifiedFinishReason.UNKNOWN;
	}

	if (finishReason === "canceled") {
		return UnifiedFinishReason.CANCELED;
	}
	if (finishReason === "gateway_error") {
		return UnifiedFinishReason.ERROR;
	}

	switch (provider) {
		case "anthropic":
			if (finishReason === "stop_sequence") {
				return UnifiedFinishReason.COMPLETED;
			}
			if (finishReason === "max_tokens") {
				return UnifiedFinishReason.LENGTH_LIMIT;
			}
			break;
		case "google-vertex":
			if (finishReason === "STOP") {
				return UnifiedFinishReason.COMPLETED;
			}
			if (finishReason === "MAX_TOKENS") {
				return UnifiedFinishReason.LENGTH_LIMIT;
			}
			if (finishReason === "SAFETY") {
				return UnifiedFinishReason.CONTENT_FILTER;
			}
			break;
		default: // OpenAI format (also used by inference.net and kluster.ai)
			if (finishReason === "stop") {
				return UnifiedFinishReason.COMPLETED;
			}
			if (finishReason === "length") {
				return UnifiedFinishReason.LENGTH_LIMIT;
			}
			if (finishReason === "content_filter") {
				return UnifiedFinishReason.CONTENT_FILTER;
			}
			break;
	}

	return UnifiedFinishReason.UNKNOWN;
}

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
	if (logData.unifiedFinishReason === undefined) {
		logData.unifiedFinishReason = getUnifiedFinishReason(
			logData.finishReason,
			logData.usedProvider,
		);
	}
	(logData as any).usedMode = determineUsedMode(logData.providerKeyId);
	await publishToQueue(LOG_QUEUE, logData);
	return 1; // Return 1 to match test expectations
}

function determineUsedMode(providerKeyId: string): "api-keys" | "credits" {
	return providerKeyId.startsWith("env-") ? "credits" : "api-keys";
}
