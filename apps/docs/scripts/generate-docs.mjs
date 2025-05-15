import { generateFiles } from "fumadocs-openapi";

void generateFiles({
	input: ["http://localhost:4002/json"],
	output: "./content/docs",
	includeDescription: true,
});
