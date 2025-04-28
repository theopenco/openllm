import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const user = new OpenAPIHono<ServerTypes>();

const publicUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string().nullable(),
});

const get = createRoute({
	method: "get",
	path: "/me",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						user: publicUserSchema.openapi({}),
					}),
				},
			},
			description: "User response object.",
		},
	},
});

user.openapi(get, async (c) => {
	const auth = c.get("authUser");

	if (!auth.user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const user = await db.query.user.findFirst({
		where: {
			id: auth.user.id,
		},
	});
	if (!user) {
		throw new HTTPException(404, {
			message: "User not found",
		});
	}

	return c.json({
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
		},
	});
});
