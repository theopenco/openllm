import type { providers } from "./providers";

export type Provider = (typeof providers)[number]["id"];

export type Model = (typeof models)[number]["providers"][number]["modelName"];

export interface ProviderModelMapping {
	providerId: (typeof providers)[number]["id"];
	modelName: string;
}

export interface ModelDefinition {
	model: string;
	providers: ProviderModelMapping[];
	/**
	 * Price per input token in USD
	 */
	inputPrice?: number;
	/**
	 * Price per output token in USD
	 */
	outputPrice?: number;
	/**
	 * Price per image input in USD
	 */
	imageInputPrice?: number;
	/**
	 * Whether the model supports JSON output mode
	 */
	jsonOutput?: boolean;
}

export let models = [
	{
		model: "custom", // custom provider which expects base URL to be set
		providers: [{ providerId: "llmgateway", modelName: "custom" }],
	},
	{
		model: "auto", // native automatic routing
		providers: [{ providerId: "llmgateway", modelName: "auto" }],
	},
	{
		model: "gpt-3.5-turbo",
		providers: [{ providerId: "openai", modelName: "gpt-3.5-turbo" }],
		inputPrice: 0.0000005,
		outputPrice: 0.0000015,
		jsonOutput: true,
	},
	{
		model: "gpt-4",
		providers: [{ providerId: "openai", modelName: "gpt-4" }],
		inputPrice: 0.00001,
		outputPrice: 0.00003,
		jsonOutput: true,
	},
	{
		model: "gpt-4o",
		providers: [{ providerId: "openai", modelName: "gpt-4o" }],
		inputPrice: 0.000005,
		outputPrice: 0.000015,
		imageInputPrice: 0.00553,
		jsonOutput: true,
	},
	{
		model: "gpt-4o-mini",
		providers: [{ providerId: "openai", modelName: "gpt-4o-mini" }],
		inputPrice: 0.0000006,
		outputPrice: 0.0000018,
		jsonOutput: true,
	},
	{
		model: "claude-3-7-sonnet-20250219",
		providers: [
			{ providerId: "anthropic", modelName: "claude-3-7-sonnet-20250219" },
		],
		inputPrice: 0.000003,
		outputPrice: 0.000015,
	},
	{
		model: "claude-3-5-sonnet-20241022",
		providers: [
			{ providerId: "anthropic", modelName: "claude-3-5-sonnet-20241022" },
		],
		inputPrice: 0.0000008,
		outputPrice: 0.000004,
	},
	{
		model: "gemini-2.0-flash",
		providers: [
			{ providerId: "google-ai-studio", modelName: "gemini-2.0-flash" },
		],
		inputPrice: 0.00000015,
		outputPrice: 0.0000006,
	},
	{
		model: "gpt-4-turbo",
		providers: [{ providerId: "openai", modelName: "gpt-4-turbo" }],
		inputPrice: 0.00001,
		outputPrice: 0.00003,
		jsonOutput: true,
	},
	{
		model: "claude-2.1",
		providers: [{ providerId: "anthropic", modelName: "claude-2.1" }],
		inputPrice: 0.000008,
		outputPrice: 0.000024,
	},
	{
		model: "llama-3.1-8b-instruct",
		providers: [
			{
				providerId: "inference.net",
				modelName: "meta-llama/llama-3.1-8b-instruct/fp-8",
			},
			{
				providerId: "kluster.ai",
				modelName: "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
			},
			{
				providerId: "together.ai",
				modelName: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
			},
		],
		inputPrice: 0.07 / 1e6,
		outputPrice: 0.33 / 1e6,
	},
	{
		model: "llama-3.1-70b-instruct",
		providers: [
			{
				providerId: "inference.net",
				modelName: "meta-llama/llama-3.1-70b-instruct/fp-16",
			},
		],
		inputPrice: 0.07 / 1e6,
		outputPrice: 0.33 / 1e6,
	},
] as const satisfies ModelDefinition[];
