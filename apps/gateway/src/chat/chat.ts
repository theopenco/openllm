import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { db } from "@openllm/db";
import { type Model, models, type Provider, providers } from "@openllm/models";
import { HTTPException } from "hono/http-exception";
import { streamSSE } from "hono/streaming";

import {
	generateCacheKey,
	getCache,
	isCachingEnabled,
	setCache,
} from "../lib/cache";
import { calculateCosts } from "../lib/costs";
import { insertLog } from "../lib/logs";

import type { ServerTypes } from "../vars";

function getProviderHeaders(
	provider: Provider,
	providerKey: any,
): Record<string, string> {
	switch (provider) {
		case "anthropic":
			return {
				"x-api-key": providerKey.token,
				"anthropic-version": "2023-06-01", // Use an appropriate version
			};
		case "google-vertex":
		case "kluster.ai":
		case "openai":
		default:
			return {
				Authorization: `Bearer ${providerKey.token}`,
			};
	}
}

async function handleProviderFallback({
	c,
	usedModel,
	usedProvider,
	apiKey,
}: {
	c: any;
	usedModel: string;
	usedProvider: Provider;
	apiKey: any;
}) {
	// Check if model has alternative providers to try
	const modelInfo = models.find((m) => m.model === usedModel);
	const providers = modelInfo?.providers as string[] | undefined;
	const currentProviderIndex = providers?.indexOf(usedProvider) ?? -1;

	if (
		!providers ||
		currentProviderIndex < 0 ||
		currentProviderIndex >= providers.length - 1
	) {
		return null;
	}

	const nextProvider = providers[currentProviderIndex + 1] as Provider;
	console.log(
		`Provider ${usedProvider} failed, trying next provider: ${nextProvider}`,
	);

	// Get the provider key for the next provider
	const nextProviderKey = await db.query.providerKey.findFirst({
		where: {
			projectId: {
				eq: apiKey.projectId,
			},
			provider: {
				eq: nextProvider,
			},
		},
	});

	if (!nextProviderKey) {
		return { success: false, nextProvider };
	}

	// Update the request to use the next provider
	const originalValid = c.req.valid;
	c.req.valid = () => ({
		...originalValid("json"),
		model: `${nextProvider}/${usedModel}`,
	});

	return { success: true, nextProvider, nextProviderKey };
}

export const chat = new OpenAPIHono<ServerTypes>();

const completions = createRoute({
	operationId: "v1_chat_completions",
	description: "Create a completion for the chat conversation",
	method: "post",
	path: "/completions",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						model: z.string().openapi({
							example: "gpt-4o",
						}),
						messages: z.array(
							z.object({
								role: z.string().openapi({
									example: "user",
								}),
								content: z.string().openapi({
									example: "Hello!",
								}),
							}),
						),
						temperature: z.number().optional(),
						max_tokens: z.number().optional(),
						top_p: z.number().optional(),
						frequency_penalty: z.number().optional(),
						presence_penalty: z.number().optional(),
						stream: z.boolean().optional().default(false),
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
				"text/event-stream": {
					schema: z.any(),
				},
			},
			description: "User response object or streaming response.",
		},
		500: {
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							message: z.string(),
							type: z.string(),
							param: z.string().nullable(),
							code: z.string(),
						}),
					}),
				},
				"text/event-stream": {
					schema: z.any(),
				},
			},
			description: "Error response object.",
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
		stream,
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

	// Apply routing logic after apiKey is available
	if (usedProvider === "openllm" && usedModel === "auto") {
		const providerKeys = await db.query.providerKey.findMany({
			where: {
				status: {
					eq: "active",
				},
				projectId: {
					eq: apiKey.projectId,
				},
			},
		});

		const availableProviders = providerKeys.map((key) => key.provider);

		for (const modelDef of models) {
			if (modelDef.model === "auto" || modelDef.model === "custom") {
				continue;
			}

			// Check if any of the model's providers are available
			const availableModelProviders = modelDef.providers.filter((provider) =>
				availableProviders.includes(provider),
			);

			if (availableModelProviders.length > 0) {
				usedModel = modelDef.model as Model;
				usedProvider = availableModelProviders[0];
				break;
			}
		}

		if (usedProvider === "openllm") {
			usedModel = "gpt-4o-mini";
			usedProvider = "openai";
		}
	} else if (usedProvider === "openllm" && usedModel === "custom") {
		usedProvider = "openllm";
		usedModel = "custom";
	} else if (!usedProvider) {
		if (modelInfo.providers.length === 1) {
			usedProvider = modelInfo.providers[0];
		} else {
			const providerKeys = await db.query.providerKey.findMany({
				where: {
					status: {
						eq: "active",
					},
					projectId: {
						eq: apiKey.projectId,
					},
					provider: {
						in: modelInfo.providers,
					},
				},
			});

			const availableProviders = providerKeys.map((key) => key.provider);

			// Filter model providers to only those available
			const availableModelProviders = modelInfo.providers.filter((provider) =>
				availableProviders.includes(provider),
			);

			if (availableModelProviders.length === 0) {
				throw new HTTPException(400, {
					message: `No API key set for provider: ${modelInfo.providers[0]}. Please add a provider key in your settings.`,
				});
			}

			const modelWithPricing = models.find(
				(m) => m.model === usedModel && "inputPrice" in m && "outputPrice" in m,
			);

			if (
				modelWithPricing &&
				"inputPrice" in modelWithPricing &&
				"outputPrice" in modelWithPricing
			) {
				let cheapestProvider = availableModelProviders[0];
				let lowestPrice = Number.MAX_VALUE;

				for (const provider of availableModelProviders) {
					const totalPrice =
						(modelWithPricing.inputPrice || 0) +
						(modelWithPricing.outputPrice || 0);

					if (totalPrice < lowestPrice) {
						lowestPrice = totalPrice;
						cheapestProvider = provider;
					}
				}

				usedProvider = cheapestProvider;
			} else {
				usedProvider = availableModelProviders[0];
			}
		}
	}

	let url: string | undefined;

	// Get the provider key for the selected provider
	const providerKey = await db.query.providerKey.findFirst({
		where: {
			status: {
				eq: "active",
			},
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
				url = process.env.OPENAI_BASE_URL || "https://api.openai.com";
				break;
			case "anthropic":
				url = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
				break;
			case "google-vertex":
				url =
					process.env.VERTEX_BASE_URL ||
					"https://generativelanguage.googleapis.com";
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

	switch (usedProvider) {
		case "anthropic":
			url += "/v1/messages";
			break;
		case "google-vertex":
			url += "/v1beta/models/" + usedModel + ":generateContent";
			break;
		case "inference.net":
			url += "/v1/chat/completions";
			break;
		case "kluster.ai":
			url += "/v1/chat/completions";
			break;
		default:
			url += "/v1/chat/completions";
	}

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

	// Check if caching is enabled for this project
	const { enabled: cachingEnabled, duration: cacheDuration } =
		await isCachingEnabled(project.id);

	let cacheKey: string | null = null;
	if (cachingEnabled && !stream) {
		// Don't cache streaming responses
		cacheKey = generateCacheKey({
			model: usedModel,
			messages,
			temperature,
			max_tokens,
			top_p,
			frequency_penalty,
			presence_penalty,
		});

		const cachedResponse = cacheKey ? await getCache(cacheKey) : null;
		if (cachedResponse) {
			console.log("Cache hit for request:", cacheKey);

			// Log the cached request
			const duration = 0; // No processing time needed
			await insertLog({
				organizationId: project.organizationId,
				projectId: apiKey.projectId,
				apiKeyId: apiKey.id,
				providerKeyId: providerKey.id,
				duration,
				usedModel: usedModel,
				usedProvider: usedProvider,
				requestedModel: requestedModel,
				requestedProvider: requestedProvider,
				messages: messages,
				responseSize: JSON.stringify(cachedResponse).length,
				content: cachedResponse.choices?.[0]?.message?.content || null,
				finishReason: "cached",
				promptTokens: cachedResponse.usage?.prompt_tokens || null,
				completionTokens: cachedResponse.usage?.completion_tokens || null,
				totalTokens: cachedResponse.usage?.total_tokens || null,
				temperature: temperature || null,
				maxTokens: max_tokens || null,
				topP: top_p || null,
				frequencyPenalty: frequency_penalty || null,
				presencePenalty: presence_penalty || null,
				hasError: false,
				streamed: false,
				canceled: false,
				errorDetails: null,
				inputCost: 0,
				outputCost: 0,
				cost: 0,
				estimatedCost: false,
			});

			return c.json(cachedResponse);
		}
	}

	// Check if streaming is requested and if the provider supports it
	if (stream) {
		const providerInfo = providers.find((p) => p.id === usedProvider);
		if (!providerInfo?.streaming) {
			throw new HTTPException(400, {
				message: `Provider ${usedProvider} does not support streaming`,
			});
		}
	}

	// Check if the request can be canceled
	const requestCanBeCanceled =
		providers.find((p) => p.id === usedProvider)?.cancellation === true;

	const requestBody: any = {
		model: usedModel,
		messages,
		stream: stream,
	};

	switch (usedProvider) {
		case "openai": {
			if (stream) {
				requestBody.stream_options = {
					include_usage: true,
				};
			}
			break;
		}
		case "anthropic": {
			requestBody.max_tokens = max_tokens || 1024; // Set a default if not provided
			requestBody.messages = messages.map((m) => ({
				role: m.role === "assistant" ? "assistant" : "user",
				content: m.content,
			}));
			break;
		}
		case "google-vertex": {
			delete requestBody.model; // Not used in body
			delete requestBody.stream; // Handled differently

			const vertexMessages = messages.map((m) => ({
				role: m.role,
				parts: [{ text: m.content }],
			}));

			requestBody.contents = vertexMessages;
			requestBody.generationConfig = {};

			// Add optional parameters if they are provided
			if (temperature !== undefined) {
				requestBody.generationConfig.temperature = temperature;
			}
			if (max_tokens !== undefined) {
				requestBody.generationConfig.maxOutputTokens = max_tokens;
			}
			if (top_p !== undefined) {
				requestBody.generationConfig.topP = top_p;
			}
			break;
		}
	}

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

	// Handle streaming response if requested
	if (stream) {
		return streamSSE(c, async (stream): Promise<void> => {
			let eventId = 0;
			let canceled = false;

			// Set up cancellation handling
			const controller = new AbortController();
			// Set up a listener for the request being aborted
			const onAbort = () => {
				if (requestCanBeCanceled) {
					canceled = true;
					controller.abort();
				}
			};

			// Add event listener for the 'close' event on the connection
			c.req.raw.signal.addEventListener("abort", onAbort);

			// Make the request to the provider
			const headers = getProviderHeaders(usedProvider, providerKey);
			headers["Content-Type"] = "application/json";

			let res;
			try {
				res = await fetch(url, {
					method: "POST",
					headers,
					body: JSON.stringify(requestBody),
					signal: controller.signal,
				});
			} catch (error) {
				console.error("error", error);
				await stream.writeSSE({
					event: "error",
					data: JSON.stringify({
						error: {
							message: `Error from provider: ${error}`,
							type: "gateway_error",
							param: null,
							code: "gateway_error",
						},
					}),
					id: String(eventId++),
				});
				await stream.writeSSE({
					event: "done",
					data: "[DONE]",
					id: String(eventId++),
				});

				// Log the error in the database
				await insertLog({
					organizationId: project.organizationId,
					projectId: apiKey.projectId,
					apiKeyId: apiKey.id,
					providerKeyId: providerKey.id,
					duration: Date.now() - startTime,
					usedModel: usedModel,
					usedProvider: usedProvider,
					requestedModel: requestedModel,
					requestedProvider: requestedProvider,
					messages: messages,
					responseSize: 0,
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
					streamed: true,
					canceled: false,
					errorDetails: {
						statusCode: 500,
						statusText: "Error",
						responseText: String(error),
					},
				});

				return;
			}

			if (!res.ok) {
				console.error("error", url, res.status, res.statusText);
				const errorResponseText = await res.text();

				const fallbackResult = await handleProviderFallback({
					c,
					usedModel,
					usedProvider,
					apiKey,
				});

				if (fallbackResult) {
					if (fallbackResult.success) {
						// Log the original error as a fallback attempt only if fallback is successful
						await insertLog({
							organizationId: project.organizationId,
							projectId: apiKey.projectId,
							apiKeyId: apiKey.id,
							providerKeyId: providerKey.id,
							duration: Date.now() - startTime,
							usedModel: usedModel,
							usedProvider: usedProvider,
							requestedModel: requestedModel,
							requestedProvider: requestedProvider,
							messages: messages,
							responseSize: errorResponseText.length,
							content: null,
							finishReason: "fallback_attempt",
							promptTokens: null,
							completionTokens: null,
							totalTokens: null,
							temperature: temperature || null,
							maxTokens: max_tokens || null,
							topP: top_p || null,
							frequencyPenalty: frequency_penalty || null,
							presencePenalty: presence_penalty || null,
							hasError: true,
							streamed: true,
							canceled: false,
							errorDetails: {
								statusCode: res.status,
								statusText: res.statusText,
								responseText: errorResponseText,
							},
							estimatedCost: false,
						});

						c.req.raw.signal.removeEventListener("abort", (e: any) => {
							if (requestCanBeCanceled) {
								controller.abort();
							}
						});

						// The handler will be called recursively with the updated request
						return (chat.openapi as any)(completions, c);
					} else {
						await stream.writeSSE({
							event: "error",
							data: JSON.stringify({
								error: {
									message: `Error from provider ${usedProvider}: ${res.status} ${res.statusText}. Could not fallback to ${fallbackResult.nextProvider}: No API key set for this provider.`,
									type: "gateway_error",
									param: null,
									code: "gateway_error",
								},
							}),
							id: String(eventId),
						});
						await stream.writeSSE({
							event: "done",
							data: "[DONE]",
							id: String(eventId! + 1),
						});
					}
				} else {
					// If no fallback was possible, send error response
					await stream.writeSSE({
						event: "error",
						data: JSON.stringify({
							error: {
								message: `Error from provider: ${res.status} ${res.statusText}`,
								type: "gateway_error",
								param: null,
								code: "gateway_error",
							},
						}),
						id: String(eventId++),
					});
					await stream.writeSSE({
						event: "done",
						data: "[DONE]",
						id: String(eventId++),
					});
				}

				// Log the error in the database (only if no fallback or fallback failed)
				await insertLog({
					organizationId: project.organizationId,
					projectId: apiKey.projectId,
					apiKeyId: apiKey.id,
					providerKeyId: providerKey.id,
					duration: Date.now() - startTime,
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
					streamed: true,
					canceled: false,
					errorDetails: {
						statusCode: res.status,
						statusText: res.statusText,
						responseText: errorResponseText,
					},
				});

				return;
			}

			// Check if response body is missing
			if (!res.body) {
				await stream.writeSSE({
					event: "error",
					data: JSON.stringify({
						error: {
							message: "No response body from provider",
							type: "gateway_error",
							param: null,
							code: "gateway_error",
						},
					}),
					id: String(eventId++),
				});
				await stream.writeSSE({
					event: "done",
					data: "[DONE]",
					id: String(eventId++),
				});
				return;
			}

			const reader = res.body.getReader();
			let fullContent = "";
			let finishReason = null;
			let promptTokens = null;
			let completionTokens = null;
			let totalTokens = null;

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						break;
					}

					// Convert the Uint8Array to a string
					const chunk = new TextDecoder().decode(value);

					// Process the chunk to extract content for logging and forward to client
					const lines = chunk.split("\n");
					for (const line of lines) {
						if (line.startsWith("data: ")) {
							if (line === "data: [DONE]") {
								await stream.writeSSE({
									event: "done",
									data: "[DONE]",
									id: String(eventId++),
								});
							} else {
								try {
									const data = JSON.parse(line.substring(6));

									// Forward the data as a proper SSE event
									await stream.writeSSE({
										event: "chunk",
										data: JSON.stringify(data),
										id: String(eventId++),
									});

									// Extract content for logging based on provider
									switch (usedProvider) {
										case "anthropic":
											if (data.delta?.text) {
												fullContent += data.delta.text;
											}
											if (data.stop_reason) {
												finishReason = data.stop_reason;
											}
											break;
										case "google-vertex":
											if (
												data.candidates &&
												data.candidates[0]?.content?.parts[0]?.text
											) {
												fullContent += data.candidates[0].content.parts[0].text;
											}
											if (data.candidates && data.candidates[0]?.finishReason) {
												finishReason = data.candidates[0].finishReason;
											}
											break;
										case "inference.net":
										case "kluster.ai":
											if (data.choices && data.choices[0]) {
												if (data.choices[0].delta?.content) {
													fullContent += data.choices[0].delta.content;
												}
												if (data.choices[0].finish_reason) {
													finishReason = data.choices[0].finish_reason;
												}
											}
											break;
										default: // OpenAI format
											if (data.choices && data.choices[0]) {
												if (data.choices[0].delta?.content) {
													fullContent += data.choices[0].delta.content;
												}
												if (data.choices[0].finish_reason) {
													finishReason = data.choices[0].finish_reason;
												}
											}
									}

									if (data.usage) {
										promptTokens = data.usage.prompt_tokens;
										completionTokens = data.usage.completion_tokens;
										totalTokens = data.usage.total_tokens;
									}
									// eslint-disable-next-line unused-imports/no-unused-vars
								} catch (e) {
									// Ignore parsing errors for incomplete JSON
								}
							}
						}
					}
				}
			} catch (error) {
				console.error("Error reading stream:", error);
				// If there's an error reading the stream, we still want to log what we have
			}

			// Calculate costs based on the model and token usage
			const costs = calculateCosts(usedModel, promptTokens, completionTokens, {
				completion: fullContent,
			});

			// Log the request in the database
			await insertLog({
				organizationId: project.organizationId,
				projectId: apiKey.projectId,
				apiKeyId: apiKey.id,
				providerKeyId: providerKey.id,
				duration: Date.now() - startTime,
				usedModel: usedModel,
				usedProvider: usedProvider,
				requestedModel: requestedModel,
				requestedProvider: requestedProvider,
				messages: messages,
				responseSize: fullContent.length,
				content: fullContent,
				finishReason: finishReason,
				promptTokens: promptTokens,
				completionTokens: completionTokens,
				totalTokens: totalTokens,
				temperature: temperature || null,
				maxTokens: max_tokens || null,
				topP: top_p || null,
				frequencyPenalty: frequency_penalty || null,
				presencePenalty: presence_penalty || null,
				hasError: false,
				errorDetails: null,
				streamed: true,
				canceled: canceled || !finishReason,
				inputCost: costs.inputCost,
				outputCost: costs.outputCost,
				cost: costs.totalCost,
				estimatedCost: costs.estimatedCost,
			});
		});
	}

	// Handle non-streaming response
	const controller = new AbortController();
	// Set up a listener for the request being aborted
	const onAbort = () => {
		if (requestCanBeCanceled) {
			controller.abort();
		}
	};

	// Add event listener for the 'close' event on the connection
	c.req.raw.signal.addEventListener("abort", onAbort);

	let canceled = false;
	let res;
	try {
		const headers = getProviderHeaders(usedProvider, providerKey);
		headers["Content-Type"] = "application/json";

		res = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify(requestBody),
			signal: controller.signal,
		});
	} catch (error) {
		console.error("error", error);

		// Log the error in the database
		await insertLog({
			organizationId: project.organizationId,
			projectId: apiKey.projectId,
			apiKeyId: apiKey.id,
			providerKeyId: providerKey.id,
			duration: Date.now() - startTime,
			usedModel: usedModel,
			usedProvider: usedProvider,
			requestedModel: requestedModel,
			requestedProvider: requestedProvider,
			messages: messages,
			responseSize: 0,
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
			streamed: false,
			canceled: false,
			errorDetails: {
				statusCode: 500,
				statusText: "Error",
				responseText: String(error),
			},
			estimatedCost: false,
		});

		return c.json(
			{
				error: {
					message: `Error from provider: ${error}`,
					type: "gateway_error",
					param: null,
					code: "gateway_error",
				},
			},
			500,
		);
	}

	if (res && !res.ok) {
		console.error("error", url, res.status, res.statusText);

		// Get the error response text
		const errorResponseText = await res.text();

		const fallbackResult = await handleProviderFallback({
			c,
			usedModel,
			usedProvider,
			apiKey,
		});

		if (fallbackResult) {
			if (fallbackResult.success) {
				// Log the original error as a fallback attempt only if fallback is successful
				await insertLog({
					organizationId: project.organizationId,
					projectId: apiKey.projectId,
					apiKeyId: apiKey.id,
					providerKeyId: providerKey.id,
					duration: Date.now() - startTime,
					usedModel: usedModel,
					usedProvider: usedProvider,
					requestedModel: requestedModel,
					requestedProvider: requestedProvider,
					messages: messages,
					responseSize: errorResponseText.length,
					content: null,
					finishReason: "fallback_attempt",
					promptTokens: null,
					completionTokens: null,
					totalTokens: null,
					temperature: temperature || null,
					maxTokens: max_tokens || null,
					topP: top_p || null,
					frequencyPenalty: frequency_penalty || null,
					presencePenalty: presence_penalty || null,
					hasError: true,
					streamed: false,
					canceled: false,
					errorDetails: {
						statusCode: res.status,
						statusText: res.statusText,
						responseText: errorResponseText,
					},
					estimatedCost: false,
				});

				// The handler will be called recursively with the updated request
				return (chat.openapi as any)(completions, c);
			} else {
				return c.json(
					{
						error: {
							message: `Error from provider ${usedProvider}: ${res.status} ${res.statusText}. Could not fallback to ${fallbackResult.nextProvider}: No API key set for this provider.`,
							type: "gateway_error",
							param: null,
							code: "gateway_error",
						},
					},
					500,
				);
			}
		}

		// Log the error in the database (only if no fallback or fallback failed)
		await insertLog({
			organizationId: project.organizationId,
			projectId: apiKey.projectId,
			apiKeyId: apiKey.id,
			providerKeyId: providerKey.id,
			duration: Date.now() - startTime,
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
			streamed: false,
			canceled: false,
			errorDetails: {
				statusCode: res.status,
				statusText: res.statusText,
				responseText: errorResponseText,
			},
			estimatedCost: false,
		});

		// Return a 500 error response
		return c.json(
			{
				error: {
					message: `Error from provider: ${res.status} ${res.statusText}`,
					type: "gateway_error",
					param: null,
					code: "gateway_error",
					requestedProvider,
					usedProvider,
					requestedModel,
					usedModel,
				},
			},
			500,
		);
	}

	if (!res) {
		throw new Error("No response from provider");
	}

	// Parse the response
	const responseText = await res.text();
	const json = JSON.parse(responseText);

	// Extract content and token counts based on provider
	let content = null;
	let finishReason = null;
	let promptTokens = null;
	let completionTokens = null;
	let totalTokens = null;

	switch (usedProvider) {
		case "anthropic":
			content = json.content[0]?.text;
			finishReason = json.stop_reason;
			break;
		case "google-vertex":
			content = json.candidates[0]?.content?.parts[0]?.text;
			finishReason = json.candidates[0]?.finishReason;
			break;
		case "inference.net":
		case "kluster.ai":
			content = json.choices[0]?.message?.content;
			finishReason = json.choices[0]?.finish_reason;
			promptTokens = json.usage?.prompt_tokens;
			completionTokens = json.usage?.completion_tokens;
			totalTokens = json.usage?.total_tokens;
			break;
		default: // OpenAI format
			content = json.choices[0]?.message?.content;
			finishReason = json.choices[0]?.finish_reason;
			promptTokens = json.usage?.prompt_tokens;
			completionTokens = json.usage?.completion_tokens;
			totalTokens = json.usage?.total_tokens;
	}

	// Calculate costs based on the model and token usage
	const costs = calculateCosts(usedModel, promptTokens, completionTokens, {
		completion: content,
	});

	// Log the request in the database
	await insertLog({
		organizationId: project.organizationId,
		projectId: apiKey.projectId,
		apiKeyId: apiKey.id,
		providerKeyId: providerKey.id,
		duration: Date.now() - startTime,
		usedModel: usedModel,
		usedProvider: usedProvider,
		requestedModel: requestedModel,
		requestedProvider: requestedProvider,
		messages: messages,
		responseSize: responseText.length,
		content: content,
		finishReason: finishReason,
		promptTokens: promptTokens,
		completionTokens: completionTokens,
		totalTokens: totalTokens,
		temperature: temperature || null,
		maxTokens: max_tokens || null,
		topP: top_p || null,
		frequencyPenalty: frequency_penalty || null,
		presencePenalty: presence_penalty || null,
		hasError: false,
		errorDetails: null,
		streamed: false,
		canceled: canceled,
		inputCost: costs.inputCost,
		outputCost: costs.outputCost,
		cost: costs.totalCost,
		estimatedCost: costs.estimatedCost,
	});

	if (cachingEnabled && cacheKey && !stream) {
		await setCache(cacheKey, json, cacheDuration);
	}

	return c.json(json);
});
