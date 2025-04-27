export interface ProviderDefinition {
	id: string;
	name: string;
	description: string;
}

export const providers = [
	{
		id: "openllm",
		name: "OpenLLM",
		description:
			"OpenLLM is a framework for building and deploying large language models.",
	},
	{
		id: "openai",
		name: "OpenAI",
		description:
			"OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.",
	},
	{
		id: "inference.net",
		name: "Inference.net",
		description:
			"Inference.net is a platform for running large language models in the cloud.",
	},
	{
		id: "kluster.ai",
		name: "Kluster.ai",
		description:
			"Kluster.ai is a platform for running large language models in the cloud.",
	},
] as const satisfies ProviderDefinition[];
