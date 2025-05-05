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

export const models = [
	{
		model: "auto", // native automatic routing
		providers: ["openllm"],
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
		model: "llama-3.3-70b-instruct",
		providers: ["inference.net", "kluster.ai"],
		inputPrice: 0.0000009,
		outputPrice: 0.0000027,
	},
	{
		model: "claude-3-sonnet",
		providers: ["anthropic"],
		inputPrice: 0.000003,
		outputPrice: 0.000015,
	},
	{
		model: "claude-3-haiku",
		providers: ["anthropic"],
		inputPrice: 0.0000008,
		outputPrice: 0.000004,
	},
	{
		model: "gemini-2.0-flash",
		providers: ["google-vertex"],
		inputPrice: 0.00000015,
		outputPrice: 0.0000006,
	},
] as const satisfies ModelDefinition[];
