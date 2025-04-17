import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { db } from "@openllm/db";
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
		model,
		messages,
		temperature,
		max_tokens,
		top_p,
		frequency_penalty,
		presence_penalty,
	} = c.req.valid("json");

	let provider = "openai";

	switch (model) {
		case "gpt-4o":
		case "gpt-4o-mini":
			provider = "openai";
			break;
		default:
			throw new HTTPException(400, {
				message: `Unsupported model: ${model}`,
			});
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

	switch (provider) {
		case "openai": {
			const key = process.env.OPENAI_API_KEY || "";
			const requestBody: any = {
				model,
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

			const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${key}`,
				},
				body: JSON.stringify(requestBody),
			});
			if (!res.ok) {
				console.error("error", res.status, res.statusText);
				throw new HTTPException(500, {
					message: `Error fetching ${res.status} ${res.statusText}`,
				});
			}
			const json = await res.json();
			return c.json(json);
		}
		default:
			throw new HTTPException(400, {
				message: `Unsupported provider: ${provider}`,
			});
	}
});
