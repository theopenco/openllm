import type { providers } from "./providers";

export type Provider = (typeof providers)[number]["id"];

export type Model = (typeof models)[number]["model"];

export interface ModelDefinition {
	model: string;
	providers: (typeof providers)[number]["id"][];
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
		providers: ["llmgateway"],
	},
	{
		model: "auto", // native automatic routing
		providers: ["llmgateway"],
	},
	{
		model: "gpt-3.5-turbo",
		providers: ["openai"],
		inputPrice: 0.0000005,
		outputPrice: 0.0000015,
	},
	{
		model: "gpt-4",
		providers: ["openai"],
		inputPrice: 0.00001,
		outputPrice: 0.00003,
	},
	{
		model: "gpt-4o",
		providers: ["openai"],
		inputPrice: 0.000005,
		outputPrice: 0.000015,
		imageInputPrice: 0.00553,
	},
	{
		model: "gpt-4o-mini",
		providers: ["openai"],
		inputPrice: 0.0000006,
		outputPrice: 0.0000018,
	},
	{
		model: "claude-3-7-sonnet-20250219",
		providers: ["anthropic"],
		inputPrice: 0.000003,
		outputPrice: 0.000015,
	},
	{
		model: "claude-3-5-sonnet-20241022",
		providers: ["anthropic"],
		inputPrice: 0.0000008,
		outputPrice: 0.000004,
	},
	{
		model: "gemini-2.0-flash",
		providers: [
			// "google-vertex",
			"google-ai-studio",
		],
		inputPrice: 0.00000015,
		outputPrice: 0.0000006,
	},
	{
		model: "gpt-4-turbo",
		providers: ["openai"],
		inputPrice: 0.00001,
		outputPrice: 0.00003,
	},
	{
		model: "llama-3.3-70b-instruct",
		providers: ["inference.net"],
		inputPrice: 0.0000009,
		outputPrice: 0.0000027,
	},
	{
		model: "llama-3.1-70b-instruct",
		providers: ["kluster.ai"],
		inputPrice: 0.0000009,
		outputPrice: 0.0000027,
	},
	{
		model: "llama-3.1-8b-instruct",
		providers: ["inference.net", "kluster.ai"],
		inputPrice: 0.0000009,
		outputPrice: 0.0000027,
	},
] as const satisfies ModelDefinition[];
