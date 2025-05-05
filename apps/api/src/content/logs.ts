import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, tables } from "@openllm/db";
import { type ModelDefinition, models } from "@openllm/models";
import { createSelectSchema } from "drizzle-zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const logs = new OpenAPIHono<ServerTypes>();

// Extend the log schema to include cost information
const baseLogSchema = createSelectSchema(tables.log);
const logSchema = baseLogSchema.extend({
	cost: z.number().optional().openapi({
		description: "Calculated cost based on token usage and model pricing",
	}),
	inputCost: z.number().optional().openapi({
		description: "Cost for input tokens",
	}),
	outputCost: z.number().optional().openapi({
		description: "Cost for output tokens",
	}),
});

const querySchema = z.object({
	apiKeyId: z.string().optional().openapi({
		description: "Filter logs by API key ID",
	}),
	providerKeyId: z.string().optional().openapi({
		description: "Filter logs by provider key ID",
	}),
	projectId: z.string().optional().openapi({
		description: "Filter logs by project ID",
	}),
	orgId: z.string().optional().openapi({
		description: "Filter logs by organization ID",
	}),
	cursor: z.string().optional().openapi({
		description: "Cursor for pagination (log ID to start after)",
	}),
	limit: z
		.string()
		.optional()
		.transform((val) => (val ? parseInt(val, 10) : undefined))
		.pipe(z.number().int().min(1).max(100).optional())
		.openapi({
			description: "Number of items to return (default: 50, max: 100)",
			example: "50",
		}),
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
						message: z.string().optional().openapi({
							description: "Optional message about the response",
						}),
						logs: z.array(logSchema).openapi({
							description: "Array of log entries",
						}),
						pagination: z
							.object({
								nextCursor: z.string().nullable().openapi({
									description:
										"Cursor to use for the next page of results, null if no more results",
								}),
								hasMore: z.boolean().openapi({
									description: "Whether there are more results available",
								}),
								limit: z.number().int().openapi({
									description: "Number of items requested per page",
								}),
							})
							.openapi({
								description: "Pagination metadata",
							}),
					}),
				},
			},
			description: "User logs response with pagination.",
		},
	},
});

logs.openapi(get, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	// Get query parameters
	const query = c.req.valid("query");
	const {
		apiKeyId,
		providerKeyId,
		projectId,
		orgId,
		cursor,
		limit: queryLimit,
	} = query;

	// Set default limit if not provided or enforce max limit
	const limit = queryLimit ? Math.min(queryLimit, 100) : 50;

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
		return c.json({
			logs: [],
			message: "No organizations found",
			pagination: {
				nextCursor: null,
				hasMore: false,
				limit,
			},
		});
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
		return c.json({
			logs: [],
			message: "No projects found",
			pagination: {
				nextCursor: null,
				hasMore: false,
				limit,
			},
		});
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

	// Add cursor-based pagination
	if (cursor) {
		// Find the log entry for the cursor to get its createdAt timestamp
		const cursorLog = await db.query.log.findFirst({
			where: {
				id: cursor,
			},
		});

		if (cursorLog) {
			// Add condition to get logs with ID less than cursor
			// This is a simpler approach that works well with the ID-based pagination
			logsWhere.id = {
				lt: cursor,
			};
		}
	}

	// Query logs with all filters
	const logs = await db.query.log.findMany({
		where: logsWhere,
		orderBy: {
			id: "desc", // Sort by ID for consistent cursor-based pagination
		},
		limit: limit + 1, // Fetch one extra to determine if there are more results
	});

	// Check if there are more results
	const hasMore = logs.length > limit;
	// Remove the extra item if we fetched more than the limit
	const paginatedLogs = hasMore ? logs.slice(0, limit) : logs;

	// Determine the next cursor (ID of the last item)
	const nextCursor =
		hasMore && paginatedLogs.length > 0
			? paginatedLogs[paginatedLogs.length - 1].id
			: null;

	if (!paginatedLogs.length) {
		return c.json({
			logs: [],
			message: "No logs found",
			pagination: {
				nextCursor: null,
				hasMore: false,
				limit,
			},
		});
	}

	// Add cost information to each log entry
	const logsWithCost = paginatedLogs.map((log) => {
		// Find the model definition to get pricing information
		const modelDef = models.find(
			(m) => m.model === log.usedModel,
		) as ModelDefinition;

		// Calculate costs based on model pricing (if available)
		const promptTokens = log.promptTokens || 0;
		const completionTokens = log.completionTokens || 0;
		const inputCost = promptTokens * (modelDef?.inputPrice ?? 0);
		const outputCost = completionTokens * (modelDef?.outputPrice ?? 0);
		const totalCost = inputCost + outputCost;

		return {
			...log,
			inputCost,
			outputCost,
			cost: totalCost,
		};
	});

	return c.json({
		logs: logsWithCost,
		pagination: {
			nextCursor,
			hasMore,
			limit,
		},
	});
});
