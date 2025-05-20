import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@openllm/auth";
import { db, tables } from "@openllm/db";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const register = new OpenAPIHono<ServerTypes>();

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

register.openapi(register, async (c) => {
	const { email, password } = c.req.valid("json");

	// sign in to register
	const res = await auth.api.signInEmail({
		body: {
			email,
			password,
		},
	});

	const user = res?.user;

	if (!user) {
		throw new Error("User not found");
	}

	await db.transaction(async (tx) => {
		const org = await tx
			.insert(tables.organization)
			.values({
				name: "Default Organization",
			})
			.returning();

		await tx.insert(tables.userOrganization).values({
			userId: res.user.id,
			organizationId: org[0].id,
		});

		await tx.insert(tables.project).values({
			name: "Default Project",
			organizationId: org[0].id,
		});
	});

	return c.json({ message: "OK" });
});
