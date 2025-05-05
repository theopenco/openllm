import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, sql } from "@openllm/db";
import { type ModelDefinition, models } from "@openllm/models";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { ServerTypes } from "../vars";

export const activity = new OpenAPIHono<ServerTypes>();

// Define the response schema for model-specific usage
const modelUsageSchema = z.object({
	model: z.string(),
	provider: z.string(),
	requestCount: z.number(),
	inputTokens: z.number(),
	outputTokens: z.number(),
	totalTokens: z.number(),
	cost: z.number(),
});

// Define the response schema for daily activity
const dailyActivitySchema = z.object({
	date: z.string(),
	requestCount: z.number(),
	inputTokens: z.number(),
	outputTokens: z.number(),
	totalTokens: z.number(),
	cost: z.number(),
	modelBreakdown: z.array(modelUsageSchema),
});

// Define the route for getting activity data
const getActivity = createRoute({
	method: "get",
	path: "/",
	request: {
		query: z.object({
			days: z
				.string()
				.transform((val) => parseInt(val, 10))
				.pipe(z.number().int().positive()),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						activity: z.array(dailyActivitySchema),
					}),
				},
			},
			description: "Activity data grouped by day",
		},
	},
});

activity.openapi(getActivity, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	// Get the days parameter from the query
	const { days } = c.req.valid("query");

	// Calculate the date range
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

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
			activity: [],
		});
	}

	// Get all organizations the user is a member of
	const organizationIds = userOrganizations.map((uo) => uo.organizationId);

	// Get all projects associated with the user's organizations
	const projects = await db.query.project.findMany({
		where: {
			organizationId: {
				in: organizationIds,
			},
		},
	});

	if (!projects.length) {
		return c.json({
			activity: [],
		});
	}

	const projectIds = projects.map((project) => project.id);

	// Query logs and group by day using raw SQL
	const result = await db.execute(sql`
		SELECT
			DATE("created_at")                    as date,
			"used_model"                          as "usedModel",
			"used_provider"                       as "usedProvider",
			COALESCE(SUM("prompt_tokens"), 0)     as "promptTokens",
			COALESCE(SUM("completion_tokens"), 0) as "completionTokens",
			COALESCE(SUM("total_tokens"), 0)      as "totalTokens",
			COUNT(*)                              as "requestCount"
		FROM "log"
		WHERE "project_id" IN (${sql.join(projectIds)})
			AND "created_at" >= ${startDate}
			AND "created_at" <= ${endDate}
		GROUP BY DATE("created_at"), "used_model", "used_provider"
		ORDER BY DATE("created_at"), "used_model"
	`);

	// The result from db.execute() is an object with rows property
	const rawLogs = result.rows;

	// Process the raw logs to create the activity response
	const activityMap = new Map<string, typeof dailyActivitySchema._type>();

	for (const log of rawLogs) {
		const promptTokens = Number(log.promptTokens);
		const completionTokens = Number(log.completionTokens);
		const totalTokens = Number(log.totalTokens);
		const requestCount = Number(log.requestCount);
		const usedModel = log.usedModel as string;

		// Find the model definition to get pricing information
		const modelDef = models.find(
			(m) => m.model === usedModel,
		) as ModelDefinition;

		// Calculate costs based on model pricing (if available)
		const inputCost = promptTokens * (modelDef?.inputPrice ?? 0);
		const outputCost = completionTokens * (modelDef?.outputPrice ?? 0);
		const totalCost = inputCost + outputCost;

		// Format the date to ensure consistency (YYYY-MM-DD)
		const dateStr =
			typeof log.date === "string"
				? log.date
				: new Date(log.date as string).toISOString().split("T")[0];

		// Create or update the day entry
		if (!activityMap.has(dateStr)) {
			activityMap.set(dateStr, {
				date: dateStr,
				requestCount: 0,
				inputTokens: 0,
				outputTokens: 0,
				totalTokens: 0,
				cost: 0,
				modelBreakdown: [],
			});
		}

		const dayData = activityMap.get(dateStr)!;

		// Update the day totals
		dayData.requestCount += requestCount;
		dayData.inputTokens += promptTokens;
		dayData.outputTokens += completionTokens;
		dayData.totalTokens += totalTokens;
		dayData.cost += totalCost;

		// Add the model breakdown
		dayData.modelBreakdown.push({
			model: log.usedModel as any,
			provider: log.usedProvider as any,
			requestCount: requestCount,
			inputTokens: promptTokens,
			outputTokens: completionTokens,
			totalTokens: totalTokens,
			cost: totalCost,
		});
	}

	// Convert the map to an array and sort by date
	const activityData = Array.from(activityMap.values()).sort((a, b) => {
		return new Date(a.date).getTime() - new Date(b.date).getTime();
	});

	return c.json({
		activity: activityData,
	});
});
