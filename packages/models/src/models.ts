import type { providers } from "./providers";

export type Provider = (typeof providers)[number]["id"];

export type Model = (typeof models)[number]["model"];

interface ModelDefinition {
	model: string;
	providers: (typeof providers)[number]["id"][];
}

export const models = [
	{
		model: "auto", // native automatic routing
		providers: ["openllm"],
	},
	{
		model: "gpt-3.5-turbo",
		providers: ["openai"],
	},
	{
		model: "gpt-4",
		providers: ["openai"],
	},
	{
		model: "gpt-4o",
		providers: ["openai"],
	},
	{
		model: "gpt-4o-mini",
		providers: ["openai"],
	},
	{
		model: "llama-3.3-70b-instruct",
		providers: ["inference.net", "kluster.ai"],
	},
	{
		model: "claude-3-sonnet",
		providers: ["anthropic"],
	},
	{
		model: "claude-3-haiku",
		providers: ["anthropic"],
	},
	{
		model: "gemini-2.0-flash",
		providers: ["google-vertex"],
	},
] as const satisfies ModelDefinition[];
