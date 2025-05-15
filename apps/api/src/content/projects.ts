import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, project } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const projects = new OpenAPIHono<ServerTypes>();

const updateCache = createRoute({
	method: "patch",
	path: "/:id/cache",
	request: {
		params: z.object({
			id: z.string().openapi({
				description: "Project ID",
			}),
		}),
		json: z.object({
			cacheEnabled: z.boolean().openapi({
				description: "Whether caching is enabled for this project",
			}),
			cacheDuration: z
				.number()
				.int()
				.min(10)
				.max(31536000) // 1 year in seconds
				.openapi({
					description: "Cache duration in seconds (min 10 seconds, max 1 year)",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						project: z.object({
							id: z.string(),
							name: z.string(),
							cacheEnabled: z.boolean(),
							cacheDuration: z.number(),
						}),
					}),
				},
			},
			description: "Project cache settings updated successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Bad request",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Project not found",
		},
	},
});

projects.openapi(updateCache, async (c) => {
	const { id } = c.req.valid("param");
	const { cacheEnabled, cacheDuration } = c.req.valid("json");
	const authUser = c.get("user");

	const userOrgs = await db.query.userOrganization.findMany({
		where: {
			userId: authUser.id,
		},
		with: {
			organization: {
				with: {
					projects: true,
				},
			},
		},
	});

	const userProjects = userOrgs.flatMap(
		(org) => org.organization?.projects || [],
	);

	const projectExists = userProjects.some((p) => p.id === id);
	if (!projectExists) {
		throw new HTTPException(404, {
			message: "Project not found",
		});
	}

	await db
		.update(project)
		.set({
			cacheEnabled,
			cacheDuration,
			updatedAt: new Date(),
		})
		.where({ id });

	const updatedProject = await db.query.project.findFirst({
		where: {
			id,
		},
	});

	if (!updatedProject) {
		throw new HTTPException(500, {
			message: "Failed to update project",
		});
	}

	return c.json({
		success: true,
		project: {
			id: updatedProject.id,
			name: updatedProject.name,
			cacheEnabled: updatedProject.cacheEnabled,
			cacheDuration: updatedProject.cacheDuration,
		},
	});
});

const getCache = createRoute({
	method: "get",
	path: "/:id/cache",
	request: {
		params: z.object({
			id: z.string().openapi({
				description: "Project ID",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						cacheEnabled: z.boolean(),
						cacheDuration: z.number(),
					}),
				},
			},
			description: "Project cache settings",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Project not found",
		},
	},
});

projects.openapi(getCache, async (c) => {
	const { id } = c.req.valid("param");
	const authUser = c.get("user");

	const userOrgs = await db.query.userOrganization.findMany({
		where: {
			userId: authUser.id,
		},
		with: {
			organization: {
				with: {
					projects: true,
				},
			},
		},
	});

	const userProjects = userOrgs.flatMap(
		(org) => org.organization?.projects || [],
	);

	const project = userProjects.find((p) => p.id === id);
	if (!project) {
		throw new HTTPException(404, {
			message: "Project not found",
		});
	}

	return c.json({
		cacheEnabled: project.cacheEnabled,
		cacheDuration: project.cacheDuration,
	});
});

export default projects;
