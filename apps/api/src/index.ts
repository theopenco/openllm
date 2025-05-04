import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { authHandler } from "./auth/handler";
import { content } from "./content";
import { exposed } from "./exposed";

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

app.route("/content", content);

app.route("/public", exposed);

app.doc("/json", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "My API",
	},
});

app.get("/docs", swaggerUI({ url: "/json" }));
