import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, eq, tables } from "@openllm/db";
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
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const user = await db.query.user.findFirst({
		where: {
			id: authUser.id,
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

const passkeySchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	deviceType: z.string().nullable(),
	createdAt: z.date(),
});

const listPasskeys = createRoute({
	method: "get",
	path: "/me/passkeys",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						passkeys: z.array(passkeySchema).openapi({}),
					}),
				},
			},
			description: "List of user's passkeys.",
		},
	},
});

user.openapi(listPasskeys, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const passkeys = await db.query.passkey.findMany({
		where: {
			userId: {
				eq: authUser.id,
			},
		},
		orderBy: (passkey, { desc }) => [desc(passkey.createdAt)],
	});

	return c.json({
		passkeys,
	});
});

const deletePasskey = createRoute({
	method: "delete",
	path: "/me/passkeys/:id",
	request: {
		params: z.object({
			id: z.string(),
		}),
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
			description: "Passkey deleted successfully.",
		},
	},
});

user.openapi(deletePasskey, async (c) => {
	const authUser = c.get("user");

	if (!authUser) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	await db
		.delete(tables.passkey)
		.where(eq(tables.passkey.id, id) && eq(tables.passkey.userId, authUser.id));

	return c.json({
		message: "Passkey deleted successfully",
	});
});
