import { writeFileSync } from "fs";

import { app } from "..";

async function generateOpenAPI() {
	const spec = app.getOpenAPIDocument({
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "API Service",
		},
	});

	writeFileSync("openapi.json", JSON.stringify(spec, null, 2));
	console.log("✅ openapi.json has been generated");
	process.exit(0);
}

generateOpenAPI();
