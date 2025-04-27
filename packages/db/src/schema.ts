import { sql } from "drizzle-orm";
import { pgTable, text, integer, json, real } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text(),
	email: text().notNull(),
	password: text().notNull(),
});

export const organization = pgTable("organization", {
	id: text("id").primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text().notNull(),
});

export const userOrganization = pgTable("user_organization", {
	id: text("id").primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id").notNull(),
});

export const project = pgTable("project", {
	id: text("id").primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text("name").notNull(),
	organizationId: text("organization_id").notNull(),
});

export const key = pgTable("key", {
	id: text("id").primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	token: text("token").notNull().unique(),
	projectId: text("project_id").notNull(),
});

export const log = pgTable("log", {
	id: text("id").primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	duration: integer("duration").notNull(),
	requestedModel: text("requested_model").notNull(),
	requestedProvider: text("requested_provider"),
	usedModel: text("used_model").notNull(),
	usedProvider: text("used_provider").notNull(),
	responseSize: integer("response_size").notNull(),
	content: text("content"),
	finishReason: text("finish_reason"),
	promptTokens: integer("prompt_tokens"),
	completionTokens: integer("completion_tokens"),
	totalTokens: integer("total_tokens"),
	projectId: text("project_id").notNull(),
	messages: json("messages").notNull(),
	temperature: real("temperature"),
	maxTokens: integer("max_tokens"),
	topP: real("top_p"),
	frequencyPenalty: real("frequency_penalty"),
	presencePenalty: real("presence_penalty"),
});
