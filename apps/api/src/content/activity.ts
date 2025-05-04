import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, tables } from "@openllm/db";
import { createSelectSchema } from "drizzle-zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const activity = new OpenAPIHono<ServerTypes>();

const logSchema = createSelectSchema(tables.log);

const querySchema = z.object({
	apiKeyId: z.string().optional().openapi({}),
	providerKeyId: z.string().optional().openapi({}),
	projectId: z.string().optional().openapi({}),
	orgId: z.string().optional().openapi({}),
});

const get = createRoute({
	method: "get",
	path: "/",
	request: {
		query: querySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string().optional().openapi({}),
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

	// Get query parameters
	const query = c.req.valid("query");
	const { apiKeyId, providerKeyId, projectId, orgId } = query;

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
		return c.json({ logs: [], message: "No organizations found" });
	}

	// Get all organizations the user is a member of
	const organizationIds = userOrganizations.map((uo) => uo.organizationId);

	// If org filter is provided, check if user has access to it
	if (orgId && !organizationIds.includes(orgId)) {
		throw new HTTPException(403, {
			message: "You don't have access to this organization",
		});
	}

	// Get all projects associated with the user's organizations
	const projectsQuery: any = {
		where: {
			organizationId: {
				in: orgId ? [orgId] : organizationIds,
			},
		},
	};

	// If projectId is provided, check if it belongs to user's organizations
	if (projectId) {
		projectsQuery.where.id = projectId;
	}

	const projects = await db.query.project.findMany(projectsQuery);

	if (!projects.length) {
		return c.json({ logs: [], message: "No projects found" });
	}

	const projectIds = projects.map((project) => project.id);

	// If projectId is provided but not found in user's projects, deny access
	if (projectId && !projectIds.includes(projectId)) {
		throw new HTTPException(403, {
			message: "You don't have access to this project",
		});
	}

	// Check apiKeyId authorization if provided
	if (apiKeyId) {
		const apiKey = await db.query.apiKey.findFirst({
			where: {
				id: apiKeyId,
			},
		});

		if (!apiKey) {
			throw new HTTPException(404, {
				message: "API key not found",
			});
		}

		// Check if the API key belongs to one of the user's projects
		if (!projectIds.includes(apiKey.projectId)) {
			throw new HTTPException(403, {
				message: "You don't have access to this API key",
			});
		}
	}

	// Check providerKeyId authorization if provided
	if (providerKeyId) {
		const providerKey = await db.query.providerKey.findFirst({
			where: {
				id: providerKeyId,
			},
		});

		if (!providerKey) {
			throw new HTTPException(404, {
				message: "Provider key not found",
			});
		}

		// Check if the provider key belongs to one of the user's projects
		if (!projectIds.includes(providerKey.projectId)) {
			throw new HTTPException(403, {
				message: "You don't have access to this provider key",
			});
		}
	}

	// Build the logs query with all applicable filters
	const logsWhere: any = {
		projectId: {
			in: projectId ? [projectId] : projectIds,
		},
	};

	// Add apiKeyId filter if provided
	if (apiKeyId) {
		logsWhere.apiKeyId = apiKeyId;
	}

	// Add providerKeyId filter if provided
	if (providerKeyId) {
		logsWhere.providerKeyId = providerKeyId;
	}

	// Query logs with all filters
	const logs = await db.query.log.findMany({
		where: logsWhere,
		orderBy: {
			createdAt: "desc",
		},
		limit: 50,
	});

	if (!logs.length) {
		return c.json({ logs: [], message: "No logs found" });
	}

	return c.json({
		logs,
	});
});
