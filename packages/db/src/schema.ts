import { sql } from "drizzle-orm";
import {
	integer,
	json,
	pgTable,
	real,
	text,
	unique,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text()
		.primaryKey()
		.notNull()
		.default(sql`uuid_generate_v4()`),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text(),
	email: text().notNull().unique(),
	password: text().notNull(),
});

export const organization = pgTable("organization", {
	id: text()
		.primaryKey()
		.notNull()
		.default(sql`uuid_generate_v4()`),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text().notNull(),
});

export const userOrganization = pgTable("user_organization", {
	id: text()
		.primaryKey()
		.notNull()
		.default(sql`uuid_generate_v4()`),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	userId: text().notNull(),
	organizationId: text().notNull(),
});

export const project = pgTable("project", {
	id: text()
		.primaryKey()
		.notNull()
		.default(sql`uuid_generate_v4()`),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text().notNull(),
	organizationId: text().notNull(),
});

export const apiKey = pgTable("api_key", {
	id: text()
		.primaryKey()
		.notNull()
		.default(sql`uuid_generate_v4()`),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	token: text().notNull().unique(),
	projectId: text().notNull(),
});

export const providerKey = pgTable(
	"provider_key",
	{
		id: text()
			.primaryKey()
			.notNull()
			.default(sql`uuid_generate_v4()`),
		createdAt: text()
			.default(sql`(current_timestamp)`)
			.notNull(),
		updatedAt: text()
			.default(sql`(current_timestamp)`)
			.notNull(),
		token: text().notNull().unique(),
		provider: text().notNull(),
		projectId: text().notNull(),
	},
	(table) => [unique().on(table.projectId, table.provider)],
);

export const log = pgTable("log", {
	id: text()
		.primaryKey()
		.notNull()
		.default(sql`uuid_generate_v4()`),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	projectId: text().notNull(),
	apiKeyId: text().notNull(),
	providerKeyId: text().notNull(),
	duration: integer().notNull(),
	requestedModel: text().notNull(),
	requestedProvider: text(),
	usedModel: text().notNull(),
	usedProvider: text().notNull(),
	responseSize: integer().notNull(),
	content: text(),
	finishReason: text(),
	promptTokens: integer(),
	completionTokens: integer(),
	totalTokens: integer(),
	messages: json().notNull(),
	temperature: real(),
	maxTokens: integer(),
	topP: real(),
	frequencyPenalty: real(),
	presencePenalty: real(),
});
