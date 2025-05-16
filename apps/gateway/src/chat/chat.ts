import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { db } from "@openllm/db";
import { type Model, models, type Provider, providers } from "@openllm/models";
import { HTTPException } from "hono/http-exception";
import { streamSSE } from "hono/streaming";

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
		case "openai":
		default:
			return {
				Authorization: `Bearer ${providerKey.token}`,
			};
	}
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

	console.log("requestBody", requestBody);

	const startTime = Date.now();

	// Handle streaming response if requested
	if (stream) {
		return streamSSE(c, async (stream) => {
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

			// Add event listener for the abort event on the connection
			c.req.raw.signal.addEventListener("abort", onAbort);

			let res;
			try {
				const headers = getProviderHeaders(usedProvider, providerKey);
				headers["Content-Type"] = "application/json";

				res = await fetch(url, {
					method: "POST",
					headers,
					body: JSON.stringify(requestBody),
					signal: requestCanBeCanceled ? controller.signal : undefined,
				});
			} catch (error) {
				// Clean up the event listeners
				c.req.raw.signal.removeEventListener("abort", onAbort);

				if (error instanceof Error && error.name === "AbortError") {
					console.log("Streaming request was canceled by the client");

					// Log the canceled request
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
						finishReason: "canceled",
						promptTokens: null,
						completionTokens: null,
						totalTokens: null,
						temperature: temperature || null,
						maxTokens: max_tokens || null,
						topP: top_p || null,
						frequencyPenalty: frequency_penalty || null,
						presencePenalty: presence_penalty || null,
						hasError: false,
						streamed: true,
						canceled: true,
						errorDetails: null,
					});

					// Send a cancellation event to the client
					await stream.writeSSE({
						event: "canceled",
						data: JSON.stringify({
							message: "Request canceled by client",
						}),
						id: String(eventId++),
					});
					await stream.writeSSE({
						event: "done",
						data: "[DONE]",
						id: String(eventId++),
					});
					return;
				} else {
					throw error;
				}
			}

			if (!res.ok) {
				console.error("error", url, res.status, res.statusText);
				const errorResponseText = await res.text();

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
			} finally {
				// Clean up the event listeners
				c.req.raw.signal.removeEventListener("abort", onAbort);

				// Log the streaming request
				const duration = Date.now() - startTime;
				const costs = calculateCosts(usedModel, promptTokens, completionTokens);
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
					responseSize: fullContent.length,
					content: fullContent,
					finishReason: canceled || !finishReason ? "canceled" : finishReason,
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
			}
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
			signal: requestCanBeCanceled ? controller.signal : undefined,
		});
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			canceled = true;
			console.log("Request was canceled by the client");
		} else {
			throw error;
		}
	} finally {
		// Clean up the event listener
		c.req.raw.signal.removeEventListener("abort", onAbort);
	}

	const duration = Date.now() - startTime;

	// If the request was canceled, log it and return a response
	if (canceled) {
		// Log the canceled request
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
			responseSize: 0,
			content: null,
			finishReason: "canceled",
			promptTokens: null,
			completionTokens: null,
			totalTokens: null,
			temperature: temperature || null,
			maxTokens: max_tokens || null,
			topP: top_p || null,
			frequencyPenalty: frequency_penalty || null,
			presencePenalty: presence_penalty || null,
			hasError: false,
			streamed: false,
			canceled: true,
			errorDetails: null,
			estimatedCost: false,
		});

		return c.json(
			{
				error: {
					message: "Request canceled by client",
					type: "canceled",
					param: null,
					code: "request_canceled",
				},
			},
			400,
		); // Using 400 status code for client closed request
	}

	if (res && !res.ok) {
		console.error("error", url, res.status, res.statusText);

		// Get the error response text
		const errorResponseText = await res.text();

		// Log the error in the database
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

	const json = await res.json();
	const responseText = JSON.stringify(json);

	// Extract content and token usage based on provider
	let content = null;
	let finishReason = null;
	let promptTokens = null;
	let completionTokens = null;
	let totalTokens = null;

	switch (usedProvider) {
		case "anthropic":
			content = json.content?.[0]?.text || null;
			finishReason = json.stop_reason || null;
			break;
		case "google-vertex":
			content = json.candidates?.[0]?.content?.parts?.[0]?.text || null;
			finishReason = json.candidates?.[0]?.finishReason || null;
			break;
		default: // OpenAI format
			content = json.choices?.[0]?.message?.content || null;
			finishReason = json.choices?.[0]?.finish_reason || null;
			promptTokens = json.usage?.prompt_tokens || null;
			completionTokens = json.usage?.completion_tokens || null;
			totalTokens = json.usage?.total_tokens || null;
	}

	// Log the successful request and response
	const costs = calculateCosts(usedModel, promptTokens, completionTokens, {
		prompt: messages.map((m) => m.content).join("\n"),
		completion: content,
	});
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
		streamed: false,
		canceled: false,
		errorDetails: null,
		inputCost: costs.inputCost,
		outputCost: costs.outputCost,
		cost: costs.totalCost,
		estimatedCost: costs.estimatedCost,
	});

	return c.json(json);
});
