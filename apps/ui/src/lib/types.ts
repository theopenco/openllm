export interface ErrorDetails {
	statusCode: number;
	statusText: string;
	responseText: string;
}

export interface Log {
	id: string;
	createdAt: string;
	updatedAt: string;
	organizationId: string;
	projectId: string;
	apiKeyId: string;
	duration: number;
	requestedModel: string;
	requestedProvider: string | null;
	usedModel: string;
	usedProvider: string;
	responseSize: number;
	content: string | null;
	finishReason: string | null;
	promptTokens: string | null;
	completionTokens: string | null;
	totalTokens: string | null;
	messages?: unknown;
	temperature: number | null;
	maxTokens: number | null;
	topP: number | null;
	frequencyPenalty: number | null;
	presencePenalty: number | null;
	hasError: boolean | null;
	errorDetails?: any;
	cost: number | null;
	inputCost: number | null;
	outputCost: number | null;
	estimatedCost: boolean | null;
	canceled: boolean | null;
	streamed: boolean | null;
	cached: boolean | null;
	unifiedFinishReason?: string | null;
	mode: string;
	usedMode: string;
}
