import { generateFiles } from "fumadocs-openapi";

void generateFiles({
	input: [
		process.env.NODE_ENV === "production"
			? "https://api.openllm.com"
			: "http://localhost:4001/json",
	],
	output: "./content/docs",
	includeDescription: true,
});
