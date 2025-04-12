import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./schema",
	out: "./migrations",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
