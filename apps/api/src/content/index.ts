import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@openllm/auth";

import { activity } from "./activity";
import keysApi from "./keys-api";
import keysProvider from "./keys-provider";
import { logs } from "./logs";
import { user } from "./user";

import type { ServerTypes } from "../vars";

export const content = new OpenAPIHono<ServerTypes>();

// Middleware to verify authentication
content.use("/*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session?.user) {
		return c.json({ message: "Unauthorized" }, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);

	return await next();
});

content.route("/user", user);

content.route("/logs", logs);

content.route("/activity", activity);

content.route("/keys", keysApi);
content.route("/keys", keysProvider);
