import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { models as modelsList } from "@openllm/models";
import { HTTPException } from "hono/http-exception";

import type { ServerTypes } from "../vars";

export const modelsApi = new OpenAPIHono<ServerTypes>();

const modelSchema = z.object({
	id: z.string(),
	name: z.string(),
	created: z.number(),
	description: z.string().optional(),
	architecture: z.object({
		input_modalities: z.array(z.enum(["text", "image"])),
		output_modalities: z.array(z.enum(["text"])),
		tokenizer: z.string().optional(),
	}),
	top_provider: z.object({
		is_moderated: z.boolean(),
	}),
	pricing: z.object({
		prompt: z.string(),
		completion: z.string(),
		image: z.string().optional(),
		request: z.string().optional(),
		input_cache_read: z.string().optional(),
		input_cache_write: z.string().optional(),
		web_search: z.string().optional(),
		internal_reasoning: z.string().optional(),
	}),
	context_length: z.number().optional(),
	hugging_face_id: z.string().optional(),
	per_request_limits: z.record(z.string()).optional(),
	supported_parameters: z.array(z.string()).optional(),
});

const listModelsResponseSchema = z.object({
	data: z.array(modelSchema),
});

const listModels = createRoute({
	method: "get",
	path: "/",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: listModelsResponseSchema,
				},
			},
			description: "List of available models",
		},
	},
});

modelsApi.openapi(listModels, async (c) => {
	try {
		const modelData = modelsList.map((model) => {
			// Determine input modalities (if model supports images)
			const inputModalities: ("text" | "image")[] = ["text"];

			// Check if any provider has imageInputPrice property and it's defined
			if (
				model.providers.some((p) => (p as any).imageInputPrice !== undefined)
			) {
				inputModalities.push("image");
			}

			const firstProviderWithPricing = model.providers.find(
				(p) =>
					(p as any).inputPrice !== undefined ||
					(p as any).outputPrice !== undefined ||
					(p as any).imageInputPrice !== undefined,
			);

			const inputPrice =
				(firstProviderWithPricing as any)?.inputPrice?.toString() || "0";
			const outputPrice =
				(firstProviderWithPricing as any)?.outputPrice?.toString() || "0";
			const imagePrice =
				(firstProviderWithPricing as any)?.imageInputPrice?.toString() || "0";

			return {
				id: model.model,
				name: model.model,
				created: Math.floor(Date.now() / 1000), // Current timestamp in seconds
				description: `${model.model} provided by ${model.providers.join(", ")}`,
				architecture: {
					input_modalities: inputModalities,
					output_modalities: ["text"] as ["text"],
					tokenizer: "GPT", // Default tokenizer
				},
				top_provider: {
					is_moderated: true,
				},
				pricing: {
					prompt: inputPrice,
					completion: outputPrice,
					image: imagePrice,
					request: "0",
					input_cache_read: "0",
					input_cache_write: "0",
					web_search: "0",
					internal_reasoning: "0",
				},
				// Estimate context length based on model name
				context_length: getContextLength(model.model),
				// Add supported parameters
				supported_parameters: getSupportedParameters(model.model),
			};
		});

		return c.json({ data: modelData });
	} catch (error) {
		console.error("Error in models endpoint:", error);
		throw new HTTPException(500, { message: "Internal server error" });
	}
});

// Helper function to estimate context length based on model name
function getContextLength(modelName: string): number {
	if (modelName.includes("gpt-4o")) {
		return 128000;
	} else if (modelName.includes("gpt-4")) {
		return 8192;
	} else if (modelName.includes("gpt-3.5")) {
		return 16385;
	} else if (modelName.includes("llama-3.3")) {
		return 128000;
	} else if (modelName.includes("llama-3.1")) {
		return 128000;
	} else if (modelName.includes("llama-3")) {
		return 8192;
	} else if (modelName.includes("claude")) {
		return 200000;
	} else if (modelName.includes("gemini")) {
		return 32768;
	}

	// Default context length
	return 8192;
}

// Helper function to determine supported parameters based on model name
function getSupportedParameters(modelName: string): string[] {
	const baseParams = [
		"temperature",
		"max_tokens",
		"top_p",
		"frequency_penalty",
		"presence_penalty",
	];

	// Add model-specific parameters
	if (modelName.includes("gpt-4") || modelName.includes("gpt-3.5")) {
		baseParams.push("response_format", "tools");
	}

	if (modelName.includes("llama")) {
		baseParams.push("top_k");
	}

	return baseParams;
}
