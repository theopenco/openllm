import { serve } from "@hono/node-server";
import { Hono } from "hono";

// Create a mock OpenAI API server
export const mockOpenAIServer = new Hono();

// Sample response for chat completions
const sampleChatCompletionResponse = {
	id: "chatcmpl-123",
	object: "chat.completion",
	created: Math.floor(Date.now() / 1000),
	model: "gpt-4o-mini",
	choices: [
		{
			index: 0,
			message: {
				role: "assistant",
				content:
					"Hello! I'm a mock response from the test server. How can I help you today?",
			},
			finish_reason: "stop",
		},
	],
	usage: {
		prompt_tokens: 10,
		completion_tokens: 20,
		total_tokens: 30,
	},
};

// Handle chat completions endpoint
mockOpenAIServer.post("/v1/chat/completions", async (c) => {
	const body = await c.req.json();

	// Get the user's message to include in the response
	const userMessage =
		body.messages.find((msg: any) => msg.role === "user")?.content || "";

	// Create a custom response that includes the user's message
	const response = {
		...sampleChatCompletionResponse,
		choices: [
			{
				...sampleChatCompletionResponse.choices[0],
				message: {
					role: "assistant",
					content: `Hello! I received your message: "${userMessage}". This is a mock response from the test server.`,
				},
			},
		],
	};

	return c.json(response);
});

let server: any = null;

export function startMockServer(port = 3001): string {
	if (server) {
		return `http://localhost:${port}`;
	}

	server = serve({
		fetch: mockOpenAIServer.fetch,
		port,
	});

	console.log(`Mock OpenAI server started on port ${port}`);
	return `http://localhost:${port}`;
}

export function stopMockServer() {
	if (server) {
		server.close();
		server = null;
		console.log("Mock OpenAI server stopped");
	}
}
