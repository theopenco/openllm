import { sql } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";

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

export const token = pgTable("token", {
	id: text().primaryKey().notNull(),
	createdAt: text("created_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	updatedAt: text("updated_at")
		.default(sql`(current_timestamp)`)
		.notNull(),
	token: text().notNull().unique(),
	organizationId: text("organization_id").notNull(),
});
