import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@openllm/db";
import "dotenv/config";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { authHandler } from "./auth/handler";
import { routes } from "./routes";
import { stripeRoutes } from "./stripe";

import type { ServerTypes } from "./vars";

export const app = new OpenAPIHono<ServerTypes>();

app.use(
	"*",
	cors({
		origin: process.env.UI_URL || "http://localhost:3002",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.onError((error, c) => {
	if (error instanceof HTTPException) {
		const status = error.status;

		if (status >= 500) {
			console.log("HTTPException", error);
		}

		return c.json(
			{
				error: true,
				status,
				message: error.message || "An error occurred",
				...(error.res ? { details: error.res } : {}),
			},
			status,
		);
	}

	// For any other errors (non-HTTPException), return 500 Internal Server Error
	console.error("Unhandled error:", error);
	return c.json(
		{
			error: true,
			status: 500,
			message: "Internal Server Error",
		},
		500,
	);
});

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

app.route("/", authHandler);

app.route("/", routes);
