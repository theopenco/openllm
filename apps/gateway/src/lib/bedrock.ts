import {
	BedrockRuntimeClient,
	InvokeModelCommand,
	InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

/**
 * Create a Bedrock client with proper AWS credentials
 */
async function createBedrockClient(
	accessKeyId?: string,
	secretAccessKey?: string,
	region?: string,
): Promise<BedrockRuntimeClient> {
	const bedrockRegion = region || process.env.AWS_REGION || "us-east-1";

	let credentials;
	if (accessKeyId && secretAccessKey) {
		// Use provided credentials
		credentials = {
			accessKeyId,
			secretAccessKey,
		};
	} else {
		// Use default credential provider chain
		credentials = await defaultProvider()();
	}

	return new BedrockRuntimeClient({
		region: bedrockRegion,
		credentials,
	});
}

/**
 * Parse AWS credentials from token string
 */
function parseAwsCredentials(token: string): {
	accessKeyId?: string;
	secretAccessKey?: string;
	region?: string;
} {
	if (!token) {
		return {};
	}

	// Support multiple formats:
	// 1. access_key:secret_key
	// 2. access_key:secret_key:region
	const parts = token.split(":");
	if (parts.length >= 2) {
		return {
			accessKeyId: parts[0],
			secretAccessKey: parts[1],
			region: parts[2] || undefined,
		};
	}

	return {};
}

/**
 * Convert Bedrock response to OpenAI-compatible format
 */
function convertBedrockResponse(
	response: any,
	modelId: string,
	requestId: string,
): any {
	if (modelId.includes("anthropic.")) {
		// Anthropic Claude response format
		return {
			id: requestId,
			object: "chat.completion",
			created: Math.floor(Date.now() / 1000),
			model: modelId,
			choices: [
				{
					index: 0,
					message: {
						role: "assistant",
						content: response.content?.[0]?.text || "",
					},
					finish_reason:
						response.stop_reason === "end_turn" ? "stop" : "length",
				},
			],
			usage: {
				prompt_tokens: response.usage?.input_tokens || 0,
				completion_tokens: response.usage?.output_tokens || 0,
				total_tokens:
					(response.usage?.input_tokens || 0) +
					(response.usage?.output_tokens || 0),
			},
		};
	} else if (modelId.includes("meta.")) {
		// Meta Llama response format
		return {
			id: requestId,
			object: "chat.completion",
			created: Math.floor(Date.now() / 1000),
			model: modelId,
			choices: [
				{
					index: 0,
					message: {
						role: "assistant",
						content: response.generation || "",
					},
					finish_reason: response.stop_reason === "stop" ? "stop" : "length",
				},
			],
			usage: {
				prompt_tokens: response.prompt_token_count || 0,
				completion_tokens: response.generation_token_count || 0,
				total_tokens:
					(response.prompt_token_count || 0) +
					(response.generation_token_count || 0),
			},
		};
	} else if (modelId.includes("amazon.")) {
		// Amazon Titan response format
		return {
			id: requestId,
			object: "chat.completion",
			created: Math.floor(Date.now() / 1000),
			model: modelId,
			choices: [
				{
					index: 0,
					message: {
						role: "assistant",
						content: response.results?.[0]?.outputText || "",
					},
					finish_reason:
						response.results?.[0]?.completionReason === "FINISH"
							? "stop"
							: "length",
				},
			],
			usage: {
				prompt_tokens: response.inputTextTokenCount || 0,
				completion_tokens: response.results?.[0]?.tokenCount || 0,
				total_tokens:
					(response.inputTextTokenCount || 0) +
					(response.results?.[0]?.tokenCount || 0),
			},
		};
	}

	// Default fallback format
	return {
		id: requestId,
		object: "chat.completion",
		created: Math.floor(Date.now() / 1000),
		model: modelId,
		choices: [
			{
				index: 0,
				message: {
					role: "assistant",
					content: JSON.stringify(response),
				},
				finish_reason: "stop",
			},
		],
		usage: {
			prompt_tokens: 0,
			completion_tokens: 0,
			total_tokens: 0,
		},
	};
}

/**
 * Make a non-streaming request to Bedrock
 */
export async function invokeBedrockModel(
	modelId: string,
	requestBody: any,
	token: string,
	requestId: string,
): Promise<any> {
	const { accessKeyId, secretAccessKey, region } = parseAwsCredentials(token);
	const client = await createBedrockClient(
		accessKeyId,
		secretAccessKey,
		region,
	);

	const command = new InvokeModelCommand({
		modelId,
		body: JSON.stringify(requestBody),
		contentType: "application/json",
		accept: "application/json",
	});

	try {
		const response = await client.send(command);
		const responseBody = JSON.parse(new TextDecoder().decode(response.body));
		return convertBedrockResponse(responseBody, modelId, requestId);
	} catch (error) {
		console.error("Bedrock API error:", error);
		throw new Error(
			`Bedrock API error: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Make a streaming request to Bedrock
 */
export async function invokeBedrockModelStream(
	modelId: string,
	requestBody: any,
	token: string,
	requestId: string,
): Promise<AsyncIterable<any>> {
	const { accessKeyId, secretAccessKey, region } = parseAwsCredentials(token);
	const client = await createBedrockClient(
		accessKeyId,
		secretAccessKey,
		region,
	);

	const command = new InvokeModelWithResponseStreamCommand({
		modelId,
		body: JSON.stringify(requestBody),
		contentType: "application/json",
		accept: "application/json",
	});

	try {
		const response = await client.send(command);

		if (!response.body) {
			throw new Error("No response body received from Bedrock");
		}

		return streamBedrockResponse(response.body, modelId, requestId);
	} catch (error) {
		console.error("Bedrock streaming API error:", error);
		throw new Error(
			`Bedrock streaming API error: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Convert Bedrock streaming response to OpenAI-compatible SSE format
 */
async function* streamBedrockResponse(
	stream: any,
	modelId: string,
	requestId: string,
): AsyncIterable<any> {
	for await (const event of stream) {
		if (event.chunk?.bytes) {
			const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

			if (modelId.includes("anthropic.")) {
				// Anthropic Claude streaming format
				if (chunk.type === "content_block_delta" && chunk.delta?.text) {
					yield {
						id: requestId,
						object: "chat.completion.chunk",
						created: Math.floor(Date.now() / 1000),
						model: modelId,
						choices: [
							{
								index: 0,
								delta: {
									content: chunk.delta.text,
								},
								finish_reason: null,
							},
						],
					};
				} else if (chunk.type === "message_stop") {
					yield {
						id: requestId,
						object: "chat.completion.chunk",
						created: Math.floor(Date.now() / 1000),
						model: modelId,
						choices: [
							{
								index: 0,
								delta: {},
								finish_reason: "stop",
							},
						],
						usage: {
							prompt_tokens: chunk.usage?.input_tokens || 0,
							completion_tokens: chunk.usage?.output_tokens,
							total_tokens:
								(chunk.usage?.input_tokens || 0) + chunk.usage?.output_tokens,
						},
					};
				}
			} else if (modelId.includes("meta.")) {
				// Meta Llama streaming format
				if (chunk.generation) {
					yield {
						id: requestId,
						object: "chat.completion.chunk",
						created: Math.floor(Date.now() / 1000),
						model: modelId,
						choices: [
							{
								index: 0,
								delta: {
									content: chunk.generation,
								},
								finish_reason: chunk.stop_reason === "stop" ? "stop" : null,
							},
						],
					};
				}
			}
		}
	}

	// Send final chunk
	yield {
		id: requestId,
		object: "chat.completion.chunk",
		created: Math.floor(Date.now() / 1000),
		model: modelId,
		choices: [
			{
				index: 0,
				delta: {},
				finish_reason: "stop",
			},
		],
	};
}
