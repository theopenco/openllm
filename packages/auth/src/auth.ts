import { db, tables } from "@openllm/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
	basePath: "/auth",
	trustedOrigins: ["http://localhost:3002"],
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: tables.user,
			session: tables.session,
			account: tables.account,
			verification: tables.verification,
		},
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},
	secret: process.env.AUTH_SECRET || "your-secret-key",
	baseURL: process.env.AUTH_URL || "http://localhost:4002",
});

export interface Variables {
	user: typeof auth.$Infer.Session.user | null;
	session: typeof auth.$Infer.Session.session | null;
}
