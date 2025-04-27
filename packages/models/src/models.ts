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
] as const satisfies ModelDefinition[];
