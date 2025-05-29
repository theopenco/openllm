import { db, tables } from "@openllm/db";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { auth } from "./auth";

describe("auth hooks", () => {
	beforeEach(async () => {
		// Clean up any existing data
		await Promise.all([
			db.delete(tables.userOrganization),
			db.delete(tables.project),
		]);

		await Promise.all([
			db.delete(tables.organization),
			db.delete(tables.user),
			db.delete(tables.account),
		]);
	});

	afterEach(async () => {
		// Clean up after tests
		await Promise.all([
			db.delete(tables.userOrganization),
			db.delete(tables.project),
		]);

		await Promise.all([
			db.delete(tables.organization),
			db.delete(tables.user),
			db.delete(tables.account),
		]);
	});

	test("should create default organization and project on signup", async () => {
		// Simulate a signup by directly calling the auth handler
		const email = `test-${Date.now()}@example.com`;
		const password = "Password123!";

		// Sign up a new user
		const signUpResponse = await auth.handler(
			new Request("http://localhost:4002/auth/sign-up/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			}),
		);

		expect(signUpResponse.status).toBe(200);

		// Get the user from the database
		const user = await db.query.user.findFirst({
			where: {
				email: {
					eq: email,
				},
			},
		});

		expect(user).not.toBeNull();
		expect(user?.email).toBe(email);

		// Check if an organization was created for the user
		const userOrganization = await db.query.userOrganization.findFirst({
			where: {
				userId: {
					eq: user!.id,
				},
			},
			with: {
				organization: true,
			},
		});

		expect(userOrganization).not.toBeNull();
		expect(userOrganization?.organization?.name).toBe("Default Organization");

		// Check if a project was created for the organization
		const project = await db.query.project.findFirst({
			where: {
				organizationId: {
					eq: userOrganization!.organization?.id,
				},
			},
		});

		expect(project).not.toBeNull();
		expect(project?.name).toBe("Default Project");
	});
});
