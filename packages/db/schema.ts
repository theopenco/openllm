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
