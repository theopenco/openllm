import { OpenAPIHono } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import { z } from "zod";

import type { ServerTypes } from "../vars";

const chat = new OpenAPIHono<ServerTypes>();

const chatCompletionSchema = z.object({
	messages: z.array(
		z.object({
			role: z.enum(["user", "assistant", "system"]),
			content: z.string(),
		}),
	),
	model: z.string(),
	stream: z.boolean().optional().default(false),
	apiKey: z.string().optional(), // Optional user API key
});

chat.post("/completion", async (c) => {
	try {
		const body = await c.req.json();
		const { messages, model, stream, apiKey } =
			chatCompletionSchema.parse(body);

		// Require user to provide their own API key
		if (!apiKey) {
			return c.json({ error: "API key is required" }, 400);
		}
		const authToken = apiKey;

		const response = await fetch(
			process.env.NODE_ENV === "production"
				? "https://api.llmgateway.io/v1/chat/completions"
				: "http://localhost:4001/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({
					model,
					messages,
					stream,
					temperature: 0.7,
					max_tokens: 2048,
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.log("playground chat gateway error:", errorText);
			try {
				const errorJson = JSON.parse(errorText);
				if (errorJson.error?.message) {
					return c.json(
						{ error: errorJson.error.message },
						response.status as any,
					);
				}
				return c.json(
					{ error: `Failed to get chat completion: ${errorText}` },
					response.status as any,
				);
			} catch (err) {
				return c.json(
					{ error: `Failed to get chat completion: ${err}` },
					response.status as any,
				);
			}
		}

		if (stream) {
			// Handle streaming response
			return streamSSE(c, async (stream) => {
				const reader = response.body?.getReader();
				if (!reader) {
					await stream.writeSSE({
						data: JSON.stringify({ error: "No response body" }),
						event: "error",
					});
					return;
				}

				const decoder = new TextDecoder();
				let buffer = "";

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							break;
						}

						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split("\n");
						buffer = lines.pop() || "";

						for (const line of lines) {
							if (line.startsWith("data: ")) {
								await stream.writeSSE({
									data: line.slice(6),
								});
							}
						}
					}
				} catch (error) {
					console.error("Streaming error:", error);
					await stream.writeSSE({
						data: JSON.stringify({ error: "Streaming failed" }),
						event: "error",
					});
				}
			});
		} else {
			// Handle non-streaming response
			const responseData = await response.json();
			return c.json({
				content: responseData.choices[0].message.content,
				role: responseData.choices[0].message.role,
			});
		}
	} catch (error) {
		console.error("Chat completion error:", error);
		return c.json({ error: "Failed to get chat completion" }, 500);
	}
});

export { chat };
