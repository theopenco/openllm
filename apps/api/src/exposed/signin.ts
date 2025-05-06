import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@openllm/auth";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const signin = new OpenAPIHono<ServerTypes>();

const register = createRoute({
	method: "post",
	path: "/register",
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

signin.openapi(register, async (c) => {
	const { email, password } = await c.req.json();

	// Use better-auth to register the user
	const result = await auth.api.signInEmail({
		body: {
			email,
			password,
		},
	});

	return c.json({ message: "OK" });
});
