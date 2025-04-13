import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

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
	const { model, messages } = await c.req.json();

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

	switch (provider) {
		case "openai": {
			const key = process.env.OPENAI_API_KEY || "";
			const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${key}`,
				},
				body: JSON.stringify({
					model,
					messages,
				}),
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
