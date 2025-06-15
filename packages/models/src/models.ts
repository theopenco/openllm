import type { providers } from "./providers";

export type Provider = (typeof providers)[number]["id"];

export type Model = (typeof models)[number]["providers"][number]["modelName"];

export interface ProviderModelMapping {
	providerId: (typeof providers)[number]["id"];
	modelName: string;
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
	 * Maximum context window size in tokens
	 */
	contextSize?: number;
	/**
	 * Whether this specific model supports streaming for this provider
	 */
	streaming: boolean;
}

export interface ModelDefinition {
	model: string;
	providers: ProviderModelMapping[];
	/**
	 * Whether the model supports JSON output mode
	 */
	jsonOutput?: boolean;
}

export let models = [
	{
		model: "custom", // custom provider which expects base URL to be set
		providers: [
			{
				providerId: "llmgateway",
				modelName: "custom",
				inputPrice: undefined,
				outputPrice: undefined,
				contextSize: undefined,
				streaming: true,
			},
		],
	},
	{
		model: "auto", // native automatic routing
		providers: [
			{
				providerId: "llmgateway",
				modelName: "auto",
				inputPrice: undefined,
				outputPrice: undefined,
				contextSize: undefined,
				streaming: true,
			},
		],
	},
	{
		model: "gpt-4o-mini",
		providers: [
			{
				providerId: "openai",
				modelName: "gpt-4o-mini",
				inputPrice: 0.15 / 1e6,
				outputPrice: 0.6 / 1e6,
				contextSize: 128000,
				streaming: true,
			},
		],
		jsonOutput: true,
	},
	{
		model: "gpt-4",
		providers: [
			{
				providerId: "openai",
				modelName: "gpt-4",
				inputPrice: 30.0 / 1e6,
				outputPrice: 60.0 / 1e6,
				contextSize: 128000,
				streaming: true,
			},
		],
		jsonOutput: false,
	},
	{
		model: "gpt-4o",
		providers: [
			{
				providerId: "openai",
				modelName: "gpt-4o",
				inputPrice: 2.5 / 1e6,
				outputPrice: 10.0 / 1e6,
				imageInputPrice: 0.00553,
				contextSize: 128000,
				streaming: true,
			},
		],
		jsonOutput: true,
	},
	{
		model: "gpt-3.5-turbo",
		providers: [
			{
				providerId: "openai",
				modelName: "gpt-3.5-turbo",
				inputPrice: 0.5 / 1e6,
				outputPrice: 1.5 / 1e6,
				contextSize: 16385,
				streaming: true,
			},
		],
		jsonOutput: true,
	},
	{
		model: "gpt-4.1",
		providers: [
			{
				providerId: "openai",
				modelName: "gpt-4.1",
				inputPrice: 2.0 / 1e6,
				outputPrice: 8.0 / 1e6,
				contextSize: 1000000,
				streaming: true,
			},
		],
		jsonOutput: true,
	},
	{
		model: "gpt-4.1-mini",
		providers: [
			{
				providerId: "openai",
				modelName: "gpt-4.1-mini",
				inputPrice: 0.4 / 1e6,
				outputPrice: 1.6 / 1e6,
				contextSize: 1000000,
				streaming: true,
			},
		],
		jsonOutput: true,
	},
	{
		model: "gpt-4.1-nano",
		providers: [
			{
				providerId: "openai",
				modelName: "gpt-4.1-nano",
				inputPrice: 0.1 / 1e6,
				outputPrice: 0.4 / 1e6,
				contextSize: 1000000,
				streaming: true,
			},
		],
		jsonOutput: true,
	},
	{
		model: "o3",
		providers: [
			{
				providerId: "openai",
				modelName: "o3",
				inputPrice: 2 / 1e6,
				outputPrice: 8 / 1e6,
				contextSize: 200000,
				streaming: false,
			},
		],
		jsonOutput: true,
	},
	{
		model: "o3-mini",
		providers: [
			{
				providerId: "openai",
				modelName: "o3-mini",
				inputPrice: 1.1 / 1e6,
				outputPrice: 4.4 / 1e6,
				contextSize: 200000,
				streaming: true,
			},
		],
		jsonOutput: true,
	},
	{
		model: "claude-3-7-sonnet-20250219",
		providers: [
			{
				providerId: "anthropic",
				modelName: "claude-3-7-sonnet-20250219",
				inputPrice: 3.0 / 1e6,
				outputPrice: 15.0 / 1e6,
				contextSize: 200000,
				streaming: true,
			},
		],
	},
	{
		model: "claude-3-5-sonnet-20241022",
		providers: [
			{
				providerId: "anthropic",
				modelName: "claude-3-5-sonnet-20241022",
				inputPrice: 3.0 / 1e6,
				outputPrice: 15.0 / 1e6,
				contextSize: 200000,
				streaming: true,
			},
		],
	},
	{
		model: "gemini-2.0-flash",
		providers: [
			{
				providerId: "google-ai-studio",
				modelName: "gemini-2.0-flash",
				inputPrice: 0.1 / 1e6,
				outputPrice: 0.4 / 1e6,
				contextSize: 1000000,
				streaming: false,
			},
		],
	},
	{
		model: "gpt-4-turbo",
		providers: [
			{
				providerId: "openai",
				modelName: "gpt-4-turbo",
				inputPrice: 10.0 / 1e6,
				outputPrice: 30.0 / 1e6,
				contextSize: 128000,
				streaming: true,
			},
		],
		jsonOutput: true,
	},
	{
		model: "claude-2.1",
		providers: [
			{
				providerId: "anthropic",
				modelName: "claude-2.1",
				inputPrice: 8.0 / 1e6,
				outputPrice: 24.0 / 1e6,
				contextSize: 200000,
				streaming: true,
			},
		],
	},
	{
		model: "llama-3.1-8b-instruct",
		providers: [
			{
				providerId: "inference.net",
				modelName: "meta-llama/llama-3.1-8b-instruct/fp-8",
				inputPrice: 0.07 / 1e6,
				outputPrice: 0.33 / 1e6,
				contextSize: 128000,
				streaming: true,
			},
			{
				providerId: "kluster.ai",
				modelName: "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
				inputPrice: 0.07 / 1e6,
				outputPrice: 0.33 / 1e6,
				contextSize: 128000,
				streaming: true,
			},
			{
				providerId: "together.ai",
				modelName: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
				inputPrice: 0.88 / 1e6,
				outputPrice: 0.88 / 1e6,
				contextSize: 128000,
				streaming: false,
			},
		],
	},
	{
		model: "llama-3.1-70b-instruct",
		providers: [
			{
				providerId: "inference.net",
				modelName: "meta-llama/llama-3.1-70b-instruct/fp-16",
				inputPrice: 0.07 / 1e6,
				outputPrice: 0.33 / 1e6,
				contextSize: 128000,
				streaming: true,
			},
		],
	},
	{
		model: "claude-3-7-sonnet",
		providers: [
			{
				providerId: "anthropic",
				modelName: "claude-3-7-sonnet-latest",
				inputPrice: 3.0 / 1e6,
				outputPrice: 15.0 / 1e6,
				contextSize: 200000,
				streaming: true,
			},
		],
	},
	{
		model: "claude-sonnet-4-20250514",
		providers: [
			{
				providerId: "anthropic",
				modelName: "claude-sonnet-4-20250514",
				inputPrice: 3.0 / 1e6,
				outputPrice: 15.0 / 1e6,
				contextSize: 200000,
				streaming: true,
			},
		],
	},
	{
		model: "claude-opus-4-20250514",
		providers: [
			{
				providerId: "anthropic",
				modelName: "claude-opus-4-20250514",
				inputPrice: 3.0 / 1e6,
				outputPrice: 15.0 / 1e6,
				contextSize: 200000,
				streaming: true,
			},
		],
	},
	{
		model: "claude-3-5-sonnet",
		providers: [
			{
				providerId: "anthropic",
				modelName: "claude-3-5-sonnet-latest",
				inputPrice: 3.0 / 1e6,
				outputPrice: 15.0 / 1e6,
				contextSize: 200000,
				streaming: true,
			},
		],
	},
	{
		model: "gemini-2.5-pro-preview-05-06",
		providers: [
			{
				providerId: "google-ai-studio",
				modelName: "gemini-2.5-pro-preview-05-06",
				inputPrice: 1.25 / 1e6,
				outputPrice: 10.0 / 1e6,
				contextSize: 1000000,
				streaming: false,
			},
		],
	},
	{
		model: "gemini-2.5-pro-preview-06-05",
		providers: [
			{
				providerId: "google-ai-studio",
				modelName: "gemini-2.5-pro-preview-06-05",
				inputPrice: 1.25 / 1e6,
				outputPrice: 10.0 / 1e6,
				contextSize: 1000000,
				streaming: false,
			},
		],
	},
	{
		model: "gemini-2.5-flash-preview-04-17",
		providers: [
			{
				providerId: "google-ai-studio",
				modelName: "gemini-2.5-flash-preview-04-17",
				inputPrice: 0.15 / 1e6,
				outputPrice: 0.6 / 1e6,
				contextSize: 1000000,
				streaming: false,
			},
		],
	},
	{
		model: "gemini-2.5-flash-preview-05-20",
		providers: [
			{
				providerId: "google-ai-studio",
				modelName: "gemini-2.5-flash-preview-05-20",
				inputPrice: 0.15 / 1e6,
				outputPrice: 0.6 / 1e6,
				contextSize: 1000000,
				streaming: false,
			},
		],
	},
	{
		model: "gemini-2.5-flash-preview-04-17-thinking",
		providers: [
			{
				providerId: "google-ai-studio",
				modelName: "gemini-2.5-flash-preview-04-17-thinking",
				inputPrice: 0.15 / 1e6,
				outputPrice: 0.6 / 1e6,
				contextSize: 1000000,
				streaming: false,
			},
		],
	},
	{
		model: "gemini-1.5-flash-8b",
		providers: [
			{
				providerId: "google-ai-studio",
				modelName: "gemini-1.5-flash-8b",
				inputPrice: 0.0375 / 1e6,
				outputPrice: 0.15 / 1e6,
				contextSize: 1000000,
				streaming: false,
			},
		],
	},
	{
		model: "gemini-2.0-flash-lite",
		providers: [
			{
				providerId: "google-ai-studio",
				modelName: "gemini-2.0-flash-lite",
				inputPrice: 0.075 / 1e6,
				outputPrice: 0.3 / 1e6,
				contextSize: 1000000,
				streaming: false,
			},
		],
	},
	{
		model: "deepseek-v3",
		providers: [
			{
				providerId: "cloudrift",
				modelName: "deepseek-ai/DeepSeek-V3",
				inputPrice: 0.15 / 1e6,
				outputPrice: 0.4 / 1e6,
				contextSize: 163840,
				streaming: true,
			},
		],
	},
	{
		model: "deepseek-r1",
		providers: [
			{
				providerId: "cloudrift",
				modelName: "deepseek-ai/DeepSeek-R1",
				inputPrice: 0.15 / 1e6,
				outputPrice: 0.4 / 1e6,
				contextSize: 163840,
				streaming: true,
			},
		],
	},
	{
		model: "deepseek-r1-0528",
		providers: [
			{
				providerId: "cloudrift",
				modelName: "deepseek-ai/DeepSeek-R1-0528",
				inputPrice: 0.25 / 1e6,
				outputPrice: 1 / 1e6,
				contextSize: 32770,
				streaming: true,
			},
		],
	},
	{
		model: "mistral-large-latest",
		providers: [
			{
				providerId: "mistral",
				modelName: "mistral-large-latest",
				inputPrice: 0.000004,
				outputPrice: 0.000012,
				contextSize: 128000,
				streaming: true,
			},
		],
		jsonOutput: false,
	},
] as const satisfies ModelDefinition[];
