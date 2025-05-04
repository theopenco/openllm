import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, tables } from "@openllm/db";
import { createSelectSchema } from "drizzle-zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const activity = new OpenAPIHono<ServerTypes>();

const logSchema = createSelectSchema(tables.log);

const get = createRoute({
	method: "get",
	path: "/",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						logs: z.array(logSchema).openapi({}),
					}),
				},
			},
			description: "User activity logs response.",
		},
	},
});

activity.openapi(get, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	// Find all organizations the user belongs to
	const userOrganizations = await db.query.userOrganization.findMany({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganizations.length) {
		return c.json({ logs: [] });
	}

	// Get all projects associated with the user's organizations
	const organizationIds = userOrganizations.map((uo) => uo.organizationId);
	const projects = await db.query.project.findMany({
		where: {
			organizationId: {
				in: organizationIds,
			},
		},
	});

	if (!projects.length) {
		return c.json({ logs: [] });
	}

	const projectIds = projects.map((project) => project.id);
	const logs = await db.query.log.findMany({
		where: {
			projectId: {
				in: projectIds,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		limit: 50,
	});

	return c.json({
		logs,
	});
});
