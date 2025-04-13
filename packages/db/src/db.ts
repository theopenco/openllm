import { drizzle } from "drizzle-orm/node-postgres";

import { relations } from "./relations";

export const db = drizzle({
	connection:
		process.env.DATABASE_URL || "postgres://postgres:pw@localhost:5389/db",
	casing: "snake_case",
	relations,
});
