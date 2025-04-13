import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const auth = new OpenAPIHono<ServerTypes>();

const login = createRoute({
	method: "post",
	path: "/login",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						email: z.string(),
						password: z.string(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "User response object.",
		},
	},
});

auth.openapi(login, async (c) => {
	const { email, password } = await c.req.json();

	console.log("login", { email, password });

	return c.json({ message: "OK" });
});
