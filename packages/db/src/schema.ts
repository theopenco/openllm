import { sql } from "drizzle-orm";
import { pgTable, text, integer, json, decimal } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
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
	id: text().primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text().notNull(),
});

export const userOrganization = pgTable("user_organization", {
	id: text().primaryKey().notNull(),
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
	id: text().primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text().notNull(),
	organizationId: text("organization_id").notNull(),
});

export const token = pgTable("token", {
	id: text().primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	token: text().notNull().unique(),
	projectId: text("project_id").notNull(),
});

export const log = pgTable("log", {
	id: text().primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	duration: integer().notNull(),
	model: text().notNull(),
	provider: text().notNull(),
	responseSize: integer("response_size").notNull(),
	content: text(),
	finishReason: text("finish_reason"),
	promptTokens: integer("prompt_tokens"),
	completionTokens: integer("completion_tokens"),
	totalTokens: integer("total_tokens"),
	projectId: text("project_id").notNull(),
	messages: json().notNull(),
	temperature: decimal(),
	maxTokens: integer("max_tokens"),
	topP: decimal("top_p"),
	frequencyPenalty: decimal("frequency_penalty"),
	presencePenalty: decimal("presence_penalty"),
});
