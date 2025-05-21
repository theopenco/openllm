import type { ProviderId } from "./providers";

/**
 * Get the appropriate headers for a given provider API call
 */
export function getProviderHeaders(
	provider: ProviderId,
	providerKey: { token: string },
): Record<string, string> {
	switch (provider) {
		case "anthropic":
			return {
				"x-api-key": providerKey.token,
				"anthropic-version": "2023-06-01",
			};
		case "google-vertex":
		case "kluster.ai":
		case "openai":
		case "inference.net":
		default:
			return {
				Authorization: `Bearer ${providerKey.token}`,
			};
	}
}

/**
 * Create a minimal valid request payload for a provider to test the API key
 */
export function createValidationPayload(provider: ProviderId): any {
	const minimalMessage = { role: "user", content: "Hello" };

	switch (provider) {
		case "anthropic": {
			return {
				model: "claude-3-haiku-20240307",
				max_tokens: 1,
				messages: [minimalMessage],
			};
		}
		case "google-vertex": {
			return {
				contents: [
					{
						role: "user",
						parts: [{ text: "Hello" }],
					},
				],
				generationConfig: {
					maxOutputTokens: 1,
				},
			};
		}
		case "inference.net":
		case "kluster.ai":
		case "openai":
		default: {
			return {
				model: "gpt-3.5-turbo",
				max_tokens: 1,
				messages: [minimalMessage],
			};
		}
	}
}

/**
 * Get the endpoint URL for a provider API call
 */
export function getProviderEndpoint(
	provider: ProviderId,
	baseUrl?: string,
	model?: string,
): string {
	let url: string;

	if (baseUrl) {
		url = baseUrl;
	} else {
		switch (provider) {
			case "llmgateway":
				throw new Error(`Provider ${provider} requires a baseUrl`);
			case "openai":
				url = "https://api.openai.com";
				break;
			case "anthropic":
				url = "https://api.anthropic.com";
				break;
			case "google-vertex":
				url = "https://generativelanguage.googleapis.com";
				break;
			case "inference.net":
			case "kluster.ai":
			default:
				throw new Error(`Provider ${provider} requires a baseUrl`);
		}
	}

	switch (provider) {
		case "anthropic":
			return `${url}/v1/messages`;
		case "google-vertex":
			if (model) {
				return `${url}/v1beta/models/${model}:generateContent`;
			}
			return `${url}/v1beta/models/gemini-1.0-pro:generateContent`;
		case "inference.net":
		case "kluster.ai":
		case "openai":
		case "llmgateway":
		default:
			return `${url}/v1/chat/completions`;
	}
}

/**
 * Get the endpoint URL for validating a provider API key
 * @deprecated Use getProviderEndpoint instead
 */
export function getValidationEndpoint(
	provider: ProviderId,
	baseUrl?: string,
): string {
	return getProviderEndpoint(provider, baseUrl);
}

/**
 * Validate a provider API key by making a minimal request
 */
export async function validateProviderKey(
	provider: ProviderId,
	token: string,
	baseUrl?: string,
	skipValidation = false,
): Promise<{ valid: boolean; error?: string }> {
	// Skip validation if requested (e.g. in test environment)
	if (skipValidation) {
		return { valid: true };
	}

	try {
		const endpoint = getValidationEndpoint(provider, baseUrl);
		const payload = createValidationPayload(provider);
		const headers = getProviderHeaders(provider, { token });
		headers["Content-Type"] = "application/json";

		const response = await fetch(endpoint, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			let errorMessage = `Error from provider: ${response.status} ${response.statusText}`;

			try {
				const errorJson = JSON.parse(errorText);
				if (errorJson.error?.message) {
					errorMessage = errorJson.error.message;
				} else if (errorJson.message) {
					errorMessage = errorJson.message;
				}
			} catch (_) {}

			return { valid: false, error: errorMessage };
		}

		return { valid: true };
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
