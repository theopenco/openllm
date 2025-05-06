import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { db, log } from "@openllm/db";
import { type Model, models, type Provider, providers } from "@openllm/models";
import { randomUUID } from "crypto";
import { HTTPException } from "hono/http-exception";

import type { ServerTypes } from "../vars";

// Environment variable for overriding provider base URLs in tests
const getProviderBaseUrl = (provider: Provider): string => {
	switch (provider) {
		case "openai":
			return process.env.OPENAI_BASE_URL || "https://api.openai.com";
		default:
			return "";
	}
};

export const chat = new OpenAPIHono<ServerTypes>();

const completions = createRoute({
	method: "post",
	path: "/completions",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						model: z.string(),
						messages: z.array(
							z.object({
								role: z.string(),
								content: z.string(),
							}),
						),
						temperature: z.number().optional(),
						max_tokens: z.number().optional(),
						top_p: z.number().optional(),
						frequency_penalty: z.number().optional(),
						presence_penalty: z.number().optional(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "User response object.",
		},
	},
});

chat.openapi(completions, async (c) => {
	const {
		model: modelInput,
		messages,
		temperature,
		max_tokens,
		top_p,
		frequency_penalty,
		presence_penalty,
	} = c.req.valid("json");

	let requestedModel: Model = modelInput as Model;
	let requestedProvider: Provider | undefined;
	if (modelInput.includes("/")) {
		const split = modelInput.split("/");
		requestedProvider = split[0] as Provider;
		requestedModel = split[1] as Model;
	}

	if (requestedProvider && !providers.find((p) => p.id === requestedProvider)) {
		throw new HTTPException(400, {
			message: `Requested provider ${requestedProvider} not supported`,
		});
	}

	if (!models.find((m) => m.model === requestedModel)) {
		throw new HTTPException(400, {
			message: `Requested model ${requestedModel} not supported`,
		});
	}

	const modelInfo = models.find((m) => m.model === requestedModel);

	if (!modelInfo) {
		throw new HTTPException(400, {
			message: `Unsupported model: ${requestedModel}`,
		});
	}

	let usedProvider = requestedProvider;
	let usedModel = requestedModel;

	if (usedProvider === "openllm" && usedModel === "auto") {
		// TODO figure out algo
		usedModel = "gpt-4o-mini";
		usedProvider = "openai";
	} else if (usedProvider === "openllm" && usedModel === "custom") {
		usedProvider = "openllm";
		usedModel = "custom";
	} else if (!usedProvider) {
		// TODO figure out algo
		usedProvider = modelInfo.providers[0];
	}

	const auth = c.req.header("Authorization");
	if (!auth) {
		throw new HTTPException(401, {
			message:
				"Unauthorized: No Authorization header provided. Expected 'Bearer your-api-token'",
		});
	}

	const split = auth.split("Bearer ");
	if (split.length !== 2) {
		throw new HTTPException(401, {
			message:
				"Unauthorized: Invalid Authorization header format. Expected 'Bearer your-api-token'",
		});
	}
	const token = split[1];
	if (!token) {
		throw new HTTPException(401, {
			message: "Unauthorized: No token provided",
		});
	}

	const apiKey = await db.query.apiKey.findFirst({
		where: {
			token: {
				eq: token,
			},
		},
	});

	if (!apiKey) {
		throw new HTTPException(401, {
			message: "Unauthorized: Invalid token",
		});
	}

	let url: string | undefined;

	// Get the provider key for the selected provider
	const providerKey = await db.query.providerKey.findFirst({
		where: {
			projectId: {
				eq: apiKey.projectId,
			},
			provider: {
				eq: usedProvider,
			},
		},
	});

	if (!providerKey) {
		throw new HTTPException(400, {
			message: `No API key set for provider: ${usedProvider}. Please add a provider key in your settings.`,
		});
	}

	// First check if the provider key has a baseUrl set (for custom providers or testing)
	if (providerKey.baseUrl) {
		url = providerKey.baseUrl;
	} else {
		// Otherwise use the default URL or environment variable
		switch (usedProvider) {
			case "openllm": {
				if (usedModel !== "custom") {
					throw new HTTPException(400, {
						message: `Invalid model: ${usedModel} for provider: ${usedProvider}`,
					});
				}
				// For openllm/custom, baseUrl is required
				break;
			}
			case "openai":
				// Use environment variable if set (for testing), otherwise use default
				url = getProviderBaseUrl(usedProvider);
				break;
			default:
				throw new HTTPException(500, {
					message: `could not use provider: ${usedProvider}`,
				});
		}
	}

	if (!url) {
		throw new HTTPException(400, {
			message: `No base URL set for provider: ${usedProvider}. Please add a base URL in your settings.`,
		});
	}

	url += "/v1/chat/completions";

	// Get the project associated with this API key
	const project = await db.query.project.findFirst({
		where: {
			id: {
				eq: apiKey.projectId,
			},
		},
	});

	if (!project) {
		throw new HTTPException(500, {
			message: "Could not find project associated with this API key",
		});
	}

	const requestBody: any = {
		model: usedModel,
		messages,
	};

	// Add optional parameters if they are provided
	if (temperature !== undefined) {
		requestBody.temperature = temperature;
	}
	if (max_tokens !== undefined) {
		requestBody.max_tokens = max_tokens;
	}
	if (top_p !== undefined) {
		requestBody.top_p = top_p;
	}
	if (frequency_penalty !== undefined) {
		requestBody.frequency_penalty = frequency_penalty;
	}
	if (presence_penalty !== undefined) {
		requestBody.presence_penalty = presence_penalty;
	}

	const startTime = Date.now();
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${providerKey.token}`,
		},
		body: JSON.stringify(requestBody),
	});
	const duration = Date.now() - startTime;

	if (!res.ok) {
		console.error("error", url, res.status, res.statusText);

		// Get the error response text
		const errorResponseText = await res.text();

		// Log the error in the database
		await db.insert(log).values({
			id: randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			projectId: apiKey.projectId,
			apiKeyId: apiKey.id,
			providerKeyId: providerKey.id,
			duration,
			usedModel: usedModel,
			usedProvider: usedProvider,
			requestedModel: requestedModel,
			requestedProvider: requestedProvider,
			messages: messages,
			responseSize: errorResponseText.length,
			content: null,
			finishReason: "gateway_error",
			promptTokens: null,
			completionTokens: null,
			totalTokens: null,
			temperature: temperature || null,
			maxTokens: max_tokens || null,
			topP: top_p || null,
			frequencyPenalty: frequency_penalty || null,
			presencePenalty: presence_penalty || null,
			hasError: true,
			errorDetails: {
				statusCode: res.status,
				statusText: res.statusText,
				responseText: errorResponseText,
			},
		});

		// Return a 500 error response
		return c.json(
			{
				error: {
					message: `Error from provider: ${res.status} ${res.statusText}`,
					type: "gateway_error",
					param: null,
					code: "gateway_error",
				},
			},
			500,
		);
	}

	const json = await res.json();
	const responseText = JSON.stringify(json);

	// Log the successful request and response
	await db.insert(log).values({
		id: randomUUID(),
		createdAt: new Date(),
		updatedAt: new Date(),
		projectId: apiKey.projectId,
		apiKeyId: apiKey.id,
		providerKeyId: providerKey.id,
		duration,
		usedModel: usedModel,
		usedProvider: usedProvider,
		requestedModel: requestedModel,
		requestedProvider: requestedProvider,
		messages: messages,
		responseSize: responseText.length,
		content: json.choices?.[0]?.message?.content || null,
		finishReason: json.choices?.[0]?.finish_reason || null,
		promptTokens: json.usage?.prompt_tokens || null,
		completionTokens: json.usage?.completion_tokens || null,
		totalTokens: json.usage?.total_tokens || null,
		temperature: temperature || null,
		maxTokens: max_tokens || null,
		topP: top_p || null,
		frequencyPenalty: frequency_penalty || null,
		presencePenalty: presence_penalty || null,
		hasError: false,
		errorDetails: null,
	});

	return c.json(json);
});
