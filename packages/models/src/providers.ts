export interface ProviderDefinition {
	id: string;
	name: string;
	description: string;
	// Whether the provider supports streaming
	streaming?: boolean;
	// Whether the provider supports request cancellation
	cancellation?: boolean;
	// Whether the provider supports JSON output mode
	jsonOutput?: boolean;
	// Color used for UI representation (hex code)
	color?: string;
}

export const providers = [
	{
		id: "llmgateway",
		name: "LLM Gateway",
		description:
			"LLMGateway is a framework for building and deploying large language models.",
		streaming: true,
		cancellation: true,
		color: "#6366f1",
	},
	{
		id: "openai",
		name: "OpenAI",
		description:
			"OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.",
		streaming: true,
		cancellation: true,
		jsonOutput: true,
		color: "#0ea5e9",
	},
	{
		id: "anthropic",
		name: "Anthropic",
		description:
			"Anthropic is a research and deployment company focused on building safe and useful AI.",
		streaming: true,
		cancellation: true,
		color: "#8b5cf6",
	},
	{
		id: "google-vertex",
		name: "Google Vertex AI",
		description:
			"Google Vertex AI is a platform for building and deploying large language models.",
		streaming: true,
		cancellation: true,
		color: "#d95656",
	},
	{
		id: "google-ai-studio",
		name: "Google AI Studio",
		description:
			"Google AI Studio is a platform for accessing Google's Gemini models.",
		streaming: false,
		cancellation: true,
		color: "#4285f4",
	},
	{
		id: "inference.net",
		name: "Inference.net",
		description:
			"Inference.net is a platform for running large language models in the cloud.",
		streaming: true,
		cancellation: true,
		color: "#10b981",
	},
	{
		id: "kluster.ai",
		name: "Kluster.ai",
		description:
			"Kluster.ai is a platform for running large language models in the cloud.",
		streaming: true,
		cancellation: true,
		color: "#f59e0b",
	},
	{
		id: "together.ai",
		name: "Together AI",
		description:
			"Together AI is a platform for running large language models in the cloud with fast inference.",
		streaming: true,
		cancellation: true,
		color: "#ff6b35",
	},
] as const satisfies ProviderDefinition[];

export type ProviderId = (typeof providers)[number]["id"];
