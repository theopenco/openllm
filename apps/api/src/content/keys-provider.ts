import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, eq, shortid, tables } from "@openllm/db";
import { providers } from "@openllm/models";
import { createSelectSchema } from "drizzle-zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const keysProvider = new OpenAPIHono<ServerTypes>();

// Create a schema for provider key responses
const providerKeySchema = createSelectSchema(tables.providerKey);

// Schema for creating a new provider key
const createProviderKeySchema = z.object({
	provider: z.string().refine((val) => providers.some((p) => p.id === val), {
		message: "Invalid provider. Must be one of the supported providers.",
	}),
});

// Schema for updating a provider key status
const updateProviderKeyStatusSchema = z.object({
	status: z.enum(["active", "inactive"]),
});

// Create a new provider key
const create = createRoute({
	method: "post",
	path: "/provider",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createProviderKeySchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						providerKey: providerKeySchema
							.omit({ token: true })
							.extend({
								token: z.string(),
							})
							.openapi({}),
					}),
				},
			},
			description: "Provider key created successfully.",
		},
	},
});

keysProvider.openapi(create, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { provider } = await c.req.json();

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

	// Use the first project for simplicity
	const projectId = userOrgs[0].organization.projects[0].id;

	// Check if a provider key already exists for this provider and project
	const existingKey = await db.query.providerKey.findFirst({
		where: {
			provider: {
				eq: provider,
			},
			projectId: {
				eq: projectId,
			},
		},
	});

	if (existingKey) {
		throw new HTTPException(400, {
			message: `A key for provider '${provider}' already exists for this project`,
		});
	}

	// Generate a token with a prefix for better identification
	const token = `${provider}_` + shortid();

	// Create the provider key
	const [providerKey] = await db
		.insert(tables.providerKey)
		.values({
			token,
			projectId,
			provider,
		})
		.returning();

	return c.json({
		providerKey: {
			...providerKey,
			token, // Include the token in the response
		},
	});
});

// List all provider keys
const list = createRoute({
	method: "get",
	path: "/provider",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						providerKeys: z
							.array(
								providerKeySchema.omit({ token: true }).extend({
									// Only return a masked version of the token
									maskedToken: z.string(),
								}),
							)
							.openapi({}),
					}),
				},
			},
			description: "List of provider keys.",
		},
	},
});

keysProvider.openapi(list, async (c) => {
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
		return c.json({ providerKeys: [] });
	}

	// Get all project IDs the user has access to
	const projectIds = userOrgs.flatMap((org) =>
		org.organization!.projects.map((project) => project.id),
	);

	// Get all provider keys for these projects
	const providerKeys = await db.query.providerKey.findMany({
		where: {
			projectId: {
				in: projectIds,
			},
		},
	});

	return c.json({
		providerKeys: providerKeys.map((key) => ({
			...key,
			maskedToken: `${key.token.substring(0, 10)}•••••••••••`,
			token: undefined,
		})),
	});
});

// Soft-delete a provider key
const deleteKey = createRoute({
	method: "delete",
	path: "/provider/:id",
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
			description: "Provider key deleted successfully.",
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
			description: "Provider key not found.",
		},
	},
});

keysProvider.openapi(deleteKey, async (c) => {
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

	// Get all project IDs the user has access to
	const projectIds = userOrgs.flatMap((org) =>
		org.organization!.projects.map((project) => project.id),
	);

	// Find the provider key
	const providerKey = await db.query.providerKey.findFirst({
		where: {
			id: {
				eq: id,
			},
			projectId: {
				in: projectIds,
			},
		},
	});

	if (!providerKey) {
		throw new HTTPException(404, {
			message: "Provider key not found",
		});
	}

	await db
		.update(tables.providerKey)
		.set({
			status: "deleted",
			updatedAt: new Date(),
		})
		.where(eq(tables.providerKey.id, id));

	return c.json({
		message: "Provider key deleted successfully",
	});
});

// Update provider key status
const updateStatus = createRoute({
	method: "patch",
	path: "/provider/:id",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: updateProviderKeyStatusSchema,
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
						providerKey: providerKeySchema
							.omit({ token: true })
							.extend({
								maskedToken: z.string(),
							})
							.openapi({}),
					}),
				},
			},
			description: "Provider key status updated successfully.",
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
			description: "Provider key not found.",
		},
	},
});

keysProvider.openapi(updateStatus, async (c) => {
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

	// Get all project IDs the user has access to
	const projectIds = userOrgs.flatMap((org) =>
		org.organization!.projects.map((project) => project.id),
	);

	// Find the provider key
	const providerKey = await db.query.providerKey.findFirst({
		where: {
			id: {
				eq: id,
			},
			projectId: {
				in: projectIds,
			},
		},
	});

	if (!providerKey) {
		throw new HTTPException(404, {
			message: "Provider key not found",
		});
	}

	// Update the provider key status
	const [updatedProviderKey] = await db
		.update(tables.providerKey)
		.set({
			status,
			updatedAt: new Date(),
		})
		.where(eq(tables.providerKey.id, id))
		.returning();

	return c.json({
		message: `Provider key status updated to ${status}`,
		providerKey: {
			...updatedProviderKey,
			maskedToken: `${updatedProviderKey.token.substring(0, 8)}•••••••••••`,
			token: undefined,
		},
	});
});

export default keysProvider;
