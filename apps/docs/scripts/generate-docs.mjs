import * as OpenAPI from "fumadocs-openapi";
import { rimraf } from "rimraf";

const out = "./content/docs/(api)";

async function generate() {
	await rimraf(out, {
		filter(v) {
			return !v.endsWith("index.mdx") && !v.endsWith("meta.json");
		},
	});

	await OpenAPI.generateFiles({
		input: [
			process.env.NODE_ENV === "production"
				? "https://api.llmgateway.io"
				: "../gateway/openapi.json",
		],
		output: out,
	});
}

void generate();
