import type { providers } from "./providers";

export type Provider = (typeof providers)[number]["id"];

export type Model = (typeof models)[number]["model"];

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
	},
	{
		model: "gpt-4",
		providers: [{ providerId: "openai", modelName: "gpt-4" }],
		inputPrice: 0.00001,
		outputPrice: 0.00003,
	},
	{
		model: "gpt-4o",
		providers: [{ providerId: "openai", modelName: "gpt-4o" }],
		inputPrice: 0.000005,
		outputPrice: 0.000015,
		imageInputPrice: 0.00553,
	},
	{
		model: "gpt-4o-mini",
		providers: [{ providerId: "openai", modelName: "gpt-4o-mini" }],
		inputPrice: 0.0000006,
		outputPrice: 0.0000018,
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
	},
	{
		model: "claude-2.1",
		providers: [{ providerId: "anthropic", modelName: "claude-2.1" }],
		inputPrice: 0.000008,
		outputPrice: 0.000024,
	},
	// {
	// 	model: "llama-3.1-8b-instruct",
	// 	providers: [
	//  ],
	// 	inputPrice: 0.0000002,
	// 	outputPrice: 0.0000006,
	// },
	// {
	// 	model: "llama-3.1-70b-instruct",
	// 	providers: [
	//  ],
	// 	inputPrice: 0.0000009,
	// 	outputPrice: 0.0000027,
	// },
	// {
	// 	model: "llama-3-8b-instruct",
	// 	providers: [
	//  ],
	// 	inputPrice: 0.0000002,
	// 	outputPrice: 0.0000006,
	// },
	/// / Together.ai models
	// {
	// 	model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
	// 	providers: [{ providerId: "together.ai", modelName: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo" }],
	// 	inputPrice: 0.00000018,
	// 	outputPrice: 0.00000018,
	// },
	// {
	// 	model: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
	// 	providers: [{ providerId: "together.ai", modelName: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo" }],
	// 	inputPrice: 0.0000012,
	// 	outputPrice: 0.0000012,
	// },
	// {
	// 	model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
	// 	providers: [{ providerId: "together.ai", modelName: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" }],
	// 	inputPrice: 0.00000088,
	// 	outputPrice: 0.00000088,
	// },
	// {
	// 	model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
	// 	providers: [{ providerId: "together.ai", modelName: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" }],
	// 	inputPrice: 0.00000018,
	// 	outputPrice: 0.00000018,
	// },
	// {
	// 	model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
	// 	providers: [{ providerId: "together.ai", modelName: "mistralai/Mixtral-8x7B-Instruct-v0.1" }],
	// 	inputPrice: 0.0000006,
	// 	outputPrice: 0.0000006,
	// },
	// {
	// 	model: "mistralai/Mixtral-8x22B-Instruct-v0.1",
	// 	providers: [{ providerId: "together.ai", modelName: "mistralai/Mixtral-8x22B-Instruct-v0.1" }],
	// 	inputPrice: 0.0000012,
	// 	outputPrice: 0.0000012,
	// },
	// {
	// 	model: "Qwen/Qwen2.5-72B-Instruct-Turbo",
	// 	providers: [{ providerId: "together.ai", modelName: "Qwen/Qwen2.5-72B-Instruct-Turbo" }],
	// 	inputPrice: 0.0000012,
	// 	outputPrice: 0.0000012,
	// },
] as const satisfies ModelDefinition[];
