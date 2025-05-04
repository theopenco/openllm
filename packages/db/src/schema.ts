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
import { customAlphabet } from "nanoid";

const generate = customAlphabet(
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);

export const shortid = (size = 20) => generate(size);

export const user = pgTable("user", {
	id: text().primaryKey().$defaultFn(shortid),
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp().notNull().defaultNow(),
	name: text(),
	email: text().notNull().unique(),
	emailVerified: boolean().notNull().default(false),
	image: text(),
});

export const session = pgTable("session", {
	id: text().primaryKey().$defaultFn(shortid),
	expiresAt: timestamp().notNull().defaultNow(),
	token: text().notNull().unique(),
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp().notNull().defaultNow(),
	ipAddress: text(),
	userAgent: text(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text().primaryKey().$defaultFn(shortid),
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
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp().notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text().primaryKey().$defaultFn(shortid),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp().notNull().defaultNow(),
	createdAt: timestamp(),
	updatedAt: timestamp(),
});

export const organization = pgTable("organization", {
	id: text().primaryKey().notNull().$defaultFn(shortid),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	name: text().notNull(),
});

export const userOrganization = pgTable("user_organization", {
	id: text().primaryKey().notNull().$defaultFn(shortid),
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
	id: text().primaryKey().notNull().$defaultFn(shortid),
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
	id: text().primaryKey().notNull().$defaultFn(shortid),
	createdAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	token: text().notNull().unique(),
	description: text().notNull(),
	status: text({
		enum: ["active", "inactive", "deleted"],
	}).default("active"),
	projectId: text().notNull(),
});

export const providerKey = pgTable(
	"provider_key",
	{
		id: text().primaryKey().notNull().$defaultFn(shortid),
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
	id: text().primaryKey().notNull().$defaultFn(shortid),
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
