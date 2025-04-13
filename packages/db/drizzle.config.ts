import { defineConfig } from "drizzle-kit";

// noinspection JSUnusedGlobalSymbols
export default defineConfig({
	dialect: "postgresql",
	schema: "./schema.ts",
	out: "./migrations",
	dbCredentials: {
		url: process.env.DATABASE_URL || "postgres://postgres:pw@localhost:5389/db",
	},
});
