import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import "dotenv/config";
import { z } from "zod";

import { authHandler } from "./auth/handler";
import { routes } from "./routes";

import type { ServerTypes } from "./vars";

export const app = new OpenAPIHono<ServerTypes>();

const root = createRoute({
	method: "get",
	path: "/",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z
						.object({
							message: z.string(),
						})
						.openapi({}),
				},
			},
			description: "Response object.",
		},
	},
});

app.openapi(root, async (c) => {
	return c.json({ message: "OK" });
});

app.route("/", authHandler);

app.route("/", routes);

app.doc("/json", {
	servers: [
		{
			url:
				process.env.NODE_ENV === "production"
					? "https://api.llmgateway.io"
					: "http://localhost:3002/api",
		},
	],
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "My API",
	},
});

app.get("/docs", swaggerUI({ url: "./json" }));
