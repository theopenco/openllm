import { db } from "@openllm/db/src";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import type { ServerTypes } from "../vars";

export const user = new Hono<ServerTypes>();

user.get("/me", async (c) => {
	const payload = c.get("jwtPayload");
	if (!payload) {
		throw new HTTPException(403, {
			message: "Unauthorized",
		});
	}

	const user = await db.query.user.findFirst({
		where: {
			id: payload.sub,
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
