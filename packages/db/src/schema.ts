import { sql } from "drizzle-orm";
import {
	boolean,
	integer,
	json,
	pgTable,
	real,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text().primaryKey().default(sql`uuid_generate_v4
		()`),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp().notNull(),
	name: text(),
	email: text().notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
});

export const session = pgTable("session", {
	id: text().primaryKey().default(sql`uuid_generate_v4
		()`),
	expiresAt: timestamp().notNull(),
	token: text().notNull().unique(),
	createdAt: timestamp().notNull(),
	updatedAt: timestamp().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text().primaryKey().default(sql`uuid_generate_v4
		()`),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp(),
	refreshTokenExpiresAt: timestamp(),
	scope: text(),
	password: text(),
	createdAt: timestamp().notNull(),
	updatedAt: timestamp().notNull(),
});

export const verification = pgTable("verification", {
	id: text().primaryKey().default(sql`uuid_generate_v4
		()`),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp().notNull(),
	createdAt: timestamp(),
	updatedAt: timestamp(),
});

export const organization = pgTable("organization", {
	id: text().primaryKey().notNull().default(sql`uuid_generate_v4
		()`),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text().notNull(),
});

export const userOrganization = pgTable("user_organization", {
	id: text().primaryKey().notNull().default(sql`uuid_generate_v4
		()`),
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
	id: text().primaryKey().notNull().default(sql`uuid_generate_v4
		()`),
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
	id: text().primaryKey().notNull().default(sql`uuid_generate_v4
		()`),
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
		id: text().primaryKey().notNull().default(sql`uuid_generate_v4
			()`),
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
	id: text().primaryKey().notNull().default(sql`uuid_generate_v4
		()`),
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
