import Credentials from "@auth/core/providers/credentials";
import { initAuthConfig } from "@hono/auth-js";
import { z } from "@hono/zod-openapi";
import { db } from "@openllm/db";
import { compare } from "bcrypt-ts";

export const signInSchema = z.object({
	email: z
		.string({ required_error: "Email is required" })
		.min(1, "Email is required")
		.email("Invalid email"),
	password: z
		.string({ required_error: "Password is required" })
		.min(1, "Password is required")
		.min(8, "Password must be more than 8 characters")
		.max(40, "Password must be less than 40 characters"),
});

export const authConfig = initAuthConfig((c) => ({
	secret: process.env.AUTH_SECRET || "secret",
	session: {
		strategy: "jwt",
		maxAge: 60 * 60 * 24 * 30, // 30 days
	},
	providers: [
		Credentials({
			name: "credentials",
			credentials: {
				email: {
					label: "Email",
					placeholder: "Email",
				},
				password: {
					label: "Password",
					placeholder: "Password",
				},
			},
			async authorize(credentials, c) {
				console.log("credentials", credentials);
				const { email, password } = await signInSchema.parseAsync(credentials);

				const user = await db.query.user.findFirst({
					where: {
						email: email.toLowerCase(),
					},
				});

				console.log("user db", user);

				if (!user) {
					return null;
				}

				const passwordsMatch = await compare(password, user.password!);
				if (passwordsMatch) {
					return user;
				}

				return user;
			},
		}),
	],
}));
