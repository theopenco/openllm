import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@openllm/auth";

import { activity } from "./activity";
import keysApi from "./keys-api";
import keysProvider from "./keys-provider";
import { logs } from "./logs";
import organization from "./organization";
import { payments } from "./payments";
import projects from "./projects";
import { user } from "./user";

import type { ServerTypes } from "../vars";

export const routes = new OpenAPIHono<ServerTypes>();

// Middleware to verify authentication
routes.use("/*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session?.user) {
		return c.json({ message: "Unauthorized" }, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);

	return await next();
});

routes.route("/user", user);

routes.route("/logs", logs);

routes.route("/activity", activity);

routes.route("/keys", keysApi);
routes.route("/keys", keysProvider);
routes.route("/projects", projects);

routes.route("/orgs", organization);
routes.route("/payments", payments);
