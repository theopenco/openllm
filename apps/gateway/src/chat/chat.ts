import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { db, log } from "@openllm/db";
import { models, providers } from "@openllm/models";
import { randomUUID } from "crypto";
import { HTTPException } from "hono/http-exception";

import type { ServerTypes } from "../vars";

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

	let requestedModel: string = modelInput;
	let requestedProvider: string | undefined;
	if (modelInput.includes("/")) {
		const split = modelInput.split("/");
		requestedProvider = split[0];
		if (!providers.find((p) => p.id === requestedProvider)) {
			throw new HTTPException(400, {
				message: `Requested provider ${requestedProvider} not supported`,
			});
		}
		requestedModel = split[1];
		if (!models.find((m) => m.model === requestedModel)) {
			throw new HTTPException(400, {
				message: `Requested model ${requestedModel} not supported`,
			});
		}
	}

	const modelInfo = models.find((m) => m.model === requestedModel);

	if (!modelInfo) {
		throw new HTTPException(400, {
			message: `Unsupported model: ${requestedModel}`,
		});
	}

	let usedProvider = requestedProvider;
	let usedModel = requestedModel;

	// TODO figure out an algo for this instead of using the first one available
	if (!usedProvider) {
		usedProvider = modelInfo.providers[0];
	}
	if (usedModel === "auto" && usedProvider === "openllm") {
		usedModel = "gpt-4o-mini";
		usedProvider = "openai";
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

	const dbToken = await db.query.token.findFirst({
		where: {
			token: {
				eq: token,
			},
		},
	});

	if (!dbToken) {
		throw new HTTPException(401, {
			message: "Unauthorized: Invalid token",
		});
	}

	switch (usedProvider) {
		case "openai": {
			const key = process.env.OPENAI_API_KEY || "";
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
			const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${key}`,
				},
				body: JSON.stringify(requestBody),
			});
			const duration = Date.now() - startTime;

			if (!res.ok) {
				console.error("error", res.status, res.statusText);
				throw new HTTPException(500, {
					message: `Error fetching ${res.status} ${res.statusText}`,
				});
			}

			const json = await res.json();
			const responseText = JSON.stringify(json);

			// Log the request and response
			await db.insert(log).values({
				id: randomUUID(),
				projectId: dbToken.projectId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
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
			});

			return c.json(json);
		}
		default:
			throw new HTTPException(500, {
				message: `could not use provider: ${usedProvider}`,
			});
	}
});
