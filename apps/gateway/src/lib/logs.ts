import { db, log } from "@openllm/db";

/**
 * Insert a log entry into the database.
 * This function is extracted to prepare for future implementation using a message queue.
 */
export async function insertLog(logData: {
	organizationId: string;
	projectId: string;
	apiKeyId: string;
	providerKeyId: string;
	duration: number;
	usedModel: string;
	usedProvider: string;
	requestedModel: string;
	requestedProvider?: string;
	messages: any;
	responseSize: number;
	content: string | null;
	finishReason: string | null;
	promptTokens: number | null;
	completionTokens: number | null;
	totalTokens: number | null;
	temperature: number | null;
	maxTokens: number | null;
	topP: number | null;
	frequencyPenalty: number | null;
	presencePenalty: number | null;
	hasError: boolean;
	streamed: boolean;
	canceled: boolean;
	errorDetails: any;
	inputCost?: number | null;
	outputCost?: number | null;
	cost?: number | null;
	estimatedCost?: boolean;
}): Promise<any> {
	return db.insert(log).values({
		createdAt: new Date(),
		updatedAt: new Date(),
		...logData,
	});
}
