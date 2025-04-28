import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, tables } from "@openllm/db";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const auth = new OpenAPIHono<ServerTypes>();

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

auth.openapi(register, async (c) => {
	const { email, password } = await c.req.json();

	await db.insert(tables.user).values({
		email: email,
		password: password,
	});

	return c.json({ message: "OK" });
});
