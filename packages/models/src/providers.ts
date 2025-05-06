export interface ProviderDefinition {
	id: string;
	name: string;
	description: string;
	// Whether the provider supports streaming
	streaming?: boolean;
	// Whether the provider supports request cancellation
	cancellation?: boolean;
}

export const providers = [
	{
		id: "openllm",
		name: "OpenLLM",
		description:
			"OpenLLM is a framework for building and deploying large language models.",
		streaming: true,
		cancellation: true,
	},
	{
		id: "openai",
		name: "OpenAI",
		description:
			"OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.",
		streaming: true,
		cancellation: true,
	},
	{
		id: "anthropic",
		name: "Anthropic",
		description:
			"Anthropic is a research and deployment company focused on building safe and useful AI.",
		streaming: true,
		cancellation: true,
	},
	{
		id: "google-vertex",
		name: "Google Vertex AI",
		description:
			"Google Vertex AI is a platform for building and deploying large language models.",
		streaming: true,
		cancellation: true,
	},
	{
		id: "inference.net",
		name: "Inference.net",
		description:
			"Inference.net is a platform for running large language models in the cloud.",
		streaming: false,
		cancellation: false,
	},
	{
		id: "kluster.ai",
		name: "Kluster.ai",
		description:
			"Kluster.ai is a platform for running large language models in the cloud.",
		streaming: false,
		cancellation: false,
	},
] as const satisfies ProviderDefinition[];
