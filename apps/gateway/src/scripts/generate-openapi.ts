import { writeFileSync } from "fs";

import { app, config } from "..";

async function generateOpenAPI() {
	const spec = app.getOpenAPIDocument(config);

	writeFileSync("openapi.json", JSON.stringify(spec, null, 2));
	console.log("✅ openapi.json has been generated");
	process.exit(0);
}

void generateOpenAPI().catch((err) => {
	console.error(err);
	process.exit(1);
});
