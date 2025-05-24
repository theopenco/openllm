import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { eq, db, shortid, tables } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const keysApi = new OpenAPIHono<ServerTypes>();

// Create a schema for API key responses
// Using z.object directly instead of createSelectSchema due to compatibility issues
const apiKeySchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	token: z.string(),
	description: z.string(),
	status: z.enum(["active", "inactive", "deleted"]).nullable(),
	organizationId: z.string(),
});

// Schema for creating a new API key
const createApiKeySchema = z.object({
	description: z.string().min(1).max(255),
});

// Schema for updating an API key status
const updateApiKeyStatusSchema = z.object({
	status: z.enum(["active", "inactive"]),
});

// Create a new API key
const create = createRoute({
	method: "post",
	path: "/api",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createApiKeySchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						apiKey: apiKeySchema
							.omit({ token: true })
							.extend({
								token: z.string(),
							})
							.openapi({}),
					}),
				},
			},
			description: "API key created successfully.",
		},
	},
});

keysApi.openapi(create, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { description } = await c.req.json();

	// Get the user's projects
	const userOrgs = await db.query.userOrganization.findMany({
		where: {
			userId: {
				eq: user.id,
			},
		},
		with: {
			organization: {
				with: {
					projects: true,
				},
			},
		},
	});

	if (!userOrgs.length || !userOrgs[0].organization?.projects.length) {
		throw new HTTPException(400, {
			message: "No projects found for user",
		});
	}

	// Use the organization directly
	const organizationId = userOrgs[0].organization.id;

	// Generate a token with a prefix for better identification
	const token = `llmgateway_` + shortid();

	// Create the API key
	const [apiKey] = await db
		.insert(tables.apiKey)
		.values({
			token,
			organizationId,
			description,
		})
		.returning();

	return c.json({
		apiKey: {
			...apiKey,
			token, // Include the token in the response
		},
	});
});

// List all API keys
const list = createRoute({
	method: "get",
	path: "/api",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						apiKeys: z
							.array(
								apiKeySchema.omit({ token: true }).extend({
									// Only return a masked version of the token
									maskedToken: z.string(),
								}),
							)
							.openapi({}),
					}),
				},
			},
			description: "List of API keys.",
		},
	},
});

keysApi.openapi(list, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	// Get the user's projects
	const userOrgs = await db.query.userOrganization.findMany({
		where: {
			userId: {
				eq: user.id,
			},
		},
		with: {
			organization: {
				with: {
					projects: true,
				},
			},
		},
	});

	if (!userOrgs.length) {
		return c.json({ apiKeys: [] });
	}

	// Get all organization IDs the user has access to
	const organizationIds = userOrgs.map((org) => org.organization!.id);

	// Get all API keys for these organizations
	const apiKeys = await db.query.apiKey.findMany({
		where: {
			organizationId: {
				in: organizationIds,
			},
		},
	});

	return c.json({
		apiKeys: apiKeys.map((key) => ({
			...key,
			maskedToken: `${key.token.substring(0, 10)}•••••••••••`,
			token: undefined,
		})),
	});
});

// Soft-delete an API key
const deleteKey = createRoute({
	method: "delete",
	path: "/api/{id}",
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
			description: "API key deleted successfully.",
		},
		401: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Unauthorized.",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "API key not found.",
		},
	},
});

keysApi.openapi(deleteKey, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	// Get the user's projects
	const userOrgs = await db.query.userOrganization.findMany({
		where: {
			userId: {
				eq: user.id,
			},
		},
		with: {
			organization: {
				with: {
					projects: true,
				},
			},
		},
	});

	// Get all organization IDs the user has access to
	const organizationIds = userOrgs.map((org) => org.organization!.id);

	// Find the API key
	const apiKey = await db.query.apiKey.findFirst({
		where: {
			id: {
				eq: id,
			},
			organizationId: {
				in: organizationIds,
			},
		},
	});

	if (!apiKey) {
		throw new HTTPException(404, {
			message: "API key not found",
		});
	}

	await db
		.update(tables.apiKey)
		.set({
			status: "deleted",
		})
		.where(eq(tables.apiKey.id, id));

	return c.json({
		message: "API key deleted successfully",
	});
});

// Update API key status
const updateStatus = createRoute({
	method: "patch",
	path: "/api/{id}",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: updateApiKeyStatusSchema,
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
						apiKey: apiKeySchema
							.omit({ token: true })
							.extend({
								maskedToken: z.string(),
							})
							.openapi({}),
					}),
				},
			},
			description: "API key status updated successfully.",
		},
		401: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Unauthorized.",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "API key not found.",
		},
	},
});

keysApi.openapi(updateStatus, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();
	const { status } = await c.req.json();

	// Get the user's projects
	const userOrgs = await db.query.userOrganization.findMany({
		where: {
			userId: {
				eq: user.id,
			},
		},
		with: {
			organization: {
				with: {
					projects: true,
				},
			},
		},
	});

	// Get all organization IDs the user has access to
	const organizationIds = userOrgs.map((org) => org.organization!.id);

	// Find the API key
	const apiKey = await db.query.apiKey.findFirst({
		where: {
			id: {
				eq: id,
			},
			organizationId: {
				in: organizationIds,
			},
		},
	});

	if (!apiKey) {
		throw new HTTPException(404, {
			message: "API key not found",
		});
	}

	// Update the API key status
	const [updatedApiKey] = await db
		.update(tables.apiKey)
		.set({
			status,
		})
		.where(eq(tables.apiKey.id, id))
		.returning();

	return c.json({
		message: `API key status updated to ${status}`,
		apiKey: {
			...updatedApiKey,
			maskedToken: `${updatedApiKey.token.substring(0, 8)}•••••••••••`,
			token: undefined,
		},
	});
});

export default keysApi;
