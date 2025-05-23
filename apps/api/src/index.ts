import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@openllm/db";
import "dotenv/config";
import { z } from "zod";

import { authHandler } from "./auth/handler";
import { routes } from "./routes";
import { stripeRoutes } from "./stripe";

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
							health: z.object({
								status: z.string(),
								database: z.object({
									connected: z.boolean(),
									error: z.string().optional(),
								}),
							}),
						})
						.openapi({}),
				},
			},
			description: "Health check response.",
		},
	},
});

app.openapi(root, async (c) => {
	const health = {
		status: "ok",
		redis: { connected: false, error: undefined as string | undefined },
		database: { connected: false, error: undefined as string | undefined },
	};

	try {
		await db.query.user.findFirst({});
		health.database.connected = true;
	} catch (error) {
		health.status = "error";
		health.database.error = "Database connection failed";
		console.error("Database healthcheck failed:", error);
	}

	return c.json({ message: "OK", health });
});

app.route("/stripe", stripeRoutes);

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
