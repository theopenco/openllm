import { generateFiles } from "fumadocs-openapi";

void generateFiles({
	input: ["http://localhost:4001/json"],
	output: "./content/docs",
	includeDescription: true,
});
