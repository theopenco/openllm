import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, eq, tables } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const organization = new OpenAPIHono<ServerTypes>();

// Define schemas directly with Zod instead of using createSelectSchema
const organizationSchema = z.object({
	id: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	name: z.string(),
	credits: z.string(),
	autoTopUpEnabled: z.boolean(),
	autoTopUpThreshold: z.string(),
	autoTopUpAmount: z.string(),
	autoTopUpLastTriggered: z.string().nullable(),
});

const projectSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	name: z.string(),
	organizationId: z.string(),
	cachingEnabled: z.boolean(),
	cacheDurationSeconds: z.number(),
	mode: z.enum(["api-keys", "credits", "hybrid"]),
});

const getOrganizations = createRoute({
	method: "get",
	path: "/",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						organizations: z.array(organizationSchema).openapi({}),
					}),
				},
			},
			description: "List of organizations the user belongs to",
		},
	},
});

organization.openapi(getOrganizations, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganizations = await db.query.userOrganization.findMany({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	const organizations = userOrganizations.map((uo) => ({
		id: uo.organization!.id,
		name: uo.organization!.name,
		credits: uo.organization!.credits,
		createdAt: uo.organization!.createdAt.toISOString(),
		updatedAt: uo.organization!.updatedAt.toISOString(),
		autoTopUpEnabled: uo.organization!.autoTopUpEnabled || false,
		autoTopUpThreshold: uo.organization!.autoTopUpThreshold || "10.00",
		autoTopUpAmount: uo.organization!.autoTopUpAmount || "10.00",
		autoTopUpLastTriggered:
			uo.organization!.autoTopUpLastTriggered?.toISOString() || null,
	}));

	return c.json({
		organizations,
	});
});

const getProjects = createRoute({
	method: "get",
	path: "/{id}/projects",
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
						projects: z.array(projectSchema).openapi({}),
					}),
				},
			},
			description: "List of projects for the specified organization",
		},
	},
});

organization.openapi(getProjects, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: {
				eq: user.id,
			},
			organizationId: {
				eq: id,
			},
		},
	});

	if (!userOrganization) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const projects = await db.query.project.findMany({
		where: {
			organizationId: {
				eq: id,
			},
		},
	});

	return c.json({
		projects,
	});
});

const updateOrganization = createRoute({
	method: "patch",
	path: "/{id}",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: z.object({
						autoTopUpEnabled: z.boolean().optional(),
						autoTopUpThreshold: z
							.string()
							.refine((val) => {
								const num = parseFloat(val);
								return num >= 5;
							}, "Threshold must be at least $5")
							.optional(),
						autoTopUpAmount: z
							.string()
							.refine((val) => {
								const num = parseFloat(val);
								return num >= 10;
							}, "Amount must be at least $10")
							.optional(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
			description: "Organization updated successfully",
		},
	},
});

organization.openapi(updateOrganization, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();
	const body = await c.req.json();

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: {
				eq: user.id,
			},
			organizationId: {
				eq: id,
			},
		},
	});

	if (!userOrganization) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const updateData: any = {
		updatedAt: new Date(),
	};

	if (body.autoTopUpEnabled !== undefined) {
		updateData.autoTopUpEnabled = body.autoTopUpEnabled;
	}
	if (body.autoTopUpThreshold !== undefined) {
		updateData.autoTopUpThreshold = body.autoTopUpThreshold;
	}
	if (body.autoTopUpAmount !== undefined) {
		updateData.autoTopUpAmount = body.autoTopUpAmount;
	}

	await db
		.update(tables.organization)
		.set(updateData)
		.where(eq(tables.organization.id, id));

	return c.json({
		success: true,
	});
});

export default organization;
