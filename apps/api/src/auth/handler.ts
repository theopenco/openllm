import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@openllm/auth";

import type { ServerTypes } from "../vars";

// Create a Hono app for auth routes
export const authHandler = new OpenAPIHono<ServerTypes>();

authHandler.use("*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return await next();
	}

	c.set("user", session.user);
	c.set("session", session.session);
	return await next();
});

authHandler.on(["POST", "GET"], "/auth/*", (c) => {
	return auth.handler(c.req.raw);
});
