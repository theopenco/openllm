import { type Model, type ModelDefinition, models } from "@openllm/models";
import { encode, encodeChat } from "gpt-tokenizer";

// Define ChatMessage type to match what gpt-tokenizer expects
interface ChatMessage {
	role: "user" | "system" | "assistant" | undefined;
	content: string;
	name?: string;
}

/**
 * Calculate costs based on model, provider, and token counts
 * If promptTokens or completionTokens are not available, it will try to calculate them
 * from the fullOutput parameter if provided
 */
export function calculateCosts(
	model: Model,
	promptTokens: number | null,
	completionTokens: number | null,
	fullOutput?: {
		messages?: ChatMessage[];
		prompt?: string;
		completion?: string;
	},
) {
	// Find the model info
	const modelInfo = models.find((m) => m.model === model) as ModelDefinition;

	if (!modelInfo) {
		return {
			inputCost: null,
			outputCost: null,
			totalCost: null,
			promptTokens,
			completionTokens,
		};
	}

	// If token counts are not provided, try to calculate them from fullOutput
	let calculatedPromptTokens = promptTokens;
	let calculatedCompletionTokens = completionTokens;

	if ((!promptTokens || !completionTokens) && fullOutput) {
		// Calculate prompt tokens
		if (!promptTokens && fullOutput) {
			if (fullOutput.messages) {
				// For chat messages
				try {
					// Convert our model to a model name that gpt-tokenizer understands
					let tokenModel:
						| "gpt-3.5-turbo"
						| "gpt-4"
						| "gpt-4o"
						| "gpt-4o-mini"
						| undefined;
					if (model === "gpt-4") {
						tokenModel = "gpt-4";
					} else if (model === "gpt-4o") {
						tokenModel = "gpt-4o";
					} else if (model === "gpt-4o-mini") {
						tokenModel = "gpt-4o-mini";
					} else if (model === "gpt-3.5-turbo") {
						tokenModel = "gpt-3.5-turbo";
					} else {
						// Default to gpt-4 for tokenization if model isn't directly supported
						tokenModel = "gpt-4";
					}
					calculatedPromptTokens = encodeChat(
						fullOutput.messages,
						tokenModel,
					).length;
				} catch (error) {
					// If encoding fails, leave as null
					console.error(`Failed to encode chat messages: ${error}`);
				}
			} else if (fullOutput.prompt) {
				// For text prompt
				try {
					calculatedPromptTokens = encode(fullOutput.prompt).length;
				} catch (error) {
					// If encoding fails, leave as null
					console.error(`Failed to encode prompt text: ${error}`);
				}
			}
		}

		// Calculate completion tokens
		if (!completionTokens && fullOutput && fullOutput.completion) {
			try {
				calculatedCompletionTokens = encode(fullOutput.completion).length;
			} catch (error) {
				// If encoding fails, leave as null
				console.error(`Failed to encode completion text: ${error}`);
			}
		}
	}

	// If we still don't have token counts, return null costs
	if (!calculatedPromptTokens || !calculatedCompletionTokens) {
		return {
			inputCost: null,
			outputCost: null,
			totalCost: null,
			promptTokens: calculatedPromptTokens,
			completionTokens: calculatedCompletionTokens,
		};
	}

	const inputPrice = modelInfo.inputPrice || 0;
	const outputPrice = modelInfo.outputPrice || 0;

	const inputCost = calculatedPromptTokens * inputPrice;
	const outputCost = calculatedCompletionTokens * outputPrice;
	const totalCost = inputCost + outputCost;

	return {
		inputCost,
		outputCost,
		totalCost,
		promptTokens: calculatedPromptTokens,
		completionTokens: calculatedCompletionTokens,
	};
}
