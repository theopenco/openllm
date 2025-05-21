import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, eq, tables } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const projects = new OpenAPIHono<ServerTypes>();

// Define schema directly with Zod instead of using createSelectSchema
const projectSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	name: z.string(),
	organizationId: z.string(),
	cachingEnabled: z.boolean(),
	cacheDurationSeconds: z.number(),
	mode: z.enum(["api-keys", "credits"]),
});

const updateProjectCachingSchema = z.object({
	cachingEnabled: z.boolean().optional(),
	cacheDurationSeconds: z.number().min(10).max(31536000).optional(), // Min 10 seconds, max 1 year
	mode: z.enum(["api-keys", "credits"]).optional(),
});

const updateProject = createRoute({
	method: "patch",
	path: "/:id",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: updateProjectCachingSchema,
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
						project: projectSchema.openapi({}),
					}),
				},
			},
			description: "Project settings updated successfully.",
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
			description: "Project not found.",
		},
	},
});

projects.openapi(updateProject, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();
	const { cachingEnabled, cacheDurationSeconds, mode } = await c.req.json();

	const userOrgs = await db.query.userOrganization.findMany({
		where: {
			userId: {
				eq: user.id,
			},
		},
		with: {
			organization: true,
		},
	});

	const orgIds = userOrgs.map((uo) => uo.organization!.id);

	const project = await db.query.project.findFirst({
		where: {
			id: {
				eq: id,
			},
			organizationId: {
				in: orgIds,
			},
		},
	});

	if (!project) {
		throw new HTTPException(404, {
			message: "Project not found",
		});
	}

	const updateData: any = {
		updatedAt: new Date(),
	};

	if (cachingEnabled !== undefined) {
		updateData.cachingEnabled = cachingEnabled;
	}

	if (cacheDurationSeconds !== undefined) {
		updateData.cacheDurationSeconds = cacheDurationSeconds;
	}

	if (mode !== undefined) {
		updateData.mode = mode;
	}

	const [updatedProject] = await db
		.update(tables.project)
		.set(updateData)
		.where(eq(tables.project.id, id))
		.returning();

	return c.json({
		message: "Project settings updated successfully",
		project: updatedProject,
	});
});

export default projects;
