import { db, tables } from "@openllm/db";
import { expect, test, beforeEach, describe, afterEach } from "vitest";

import { app } from "..";
import { createTestUser, deleteAll } from "../testing";

describe("keys route", () => {
	let token: string;

	afterEach(async () => {
		await deleteAll();
	});

	beforeEach(async () => {
		token = await createTestUser();

		// Create test organization
		await db.insert(tables.organization).values({
			id: "test-org-id",
			name: "Test Organization",
		});

		// Associate user with organization
		await db.insert(tables.userOrganization).values({
			id: "test-user-org-id",
			userId: "test-user-id",
			organizationId: "test-org-id",
		});

		// Create test project
		await db.insert(tables.project).values({
			id: "test-project-id",
			name: "Test Project",
			organizationId: "test-org-id",
		});

		// Create test API key
		await db.insert(tables.apiKey).values({
			id: "test-api-key-id",
			token: "test-token",
			projectId: "test-project-id",
			description: "Test API Key",
		});
	});

	test("GET /content/keys/api unauthorized", async () => {
		const res = await app.request("/content/keys/api");
		expect(res.status).toBe(401);
	});

	test("POST /content/keys/api unauthorized", async () => {
		const res = await app.request("/content/keys/api", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				description: "New API Key",
			}),
		});
		expect(res.status).toBe(401);
	});

	test("DELETE /content/keys/api/test-api-key-id unauthorized", async () => {
		const res = await app.request("/content/keys/api/test-api-key-id", {
			method: "DELETE",
		});
		expect(res.status).toBe(401);
	});

	test("PATCH /content/keys/api/test-api-key-id unauthorized", async () => {
		const res = await app.request("/content/keys/api/test-api-key-id", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				status: "inactive",
			}),
		});
		expect(res.status).toBe(401);
	});

	test("GET /content/keys/api", async () => {
		const res = await app.request("/content/keys/api", {
			headers: {
				Cookie: token,
			},
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("apiKeys");
		expect(json.apiKeys.length).toBe(1);
		expect(json.apiKeys[0].description).toBe("Test API Key");
	});

	test("PATCH /content/keys/api/:id", async () => {
		const res = await app.request("/content/keys/api/test-api-key-id", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Cookie: token,
			},
			body: JSON.stringify({
				status: "inactive",
			}),
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("message");
		expect(json).toHaveProperty("apiKey");
		expect(json.apiKey.status).toBe("inactive");

		// Verify the key was updated in the database
		const apiKey = await db.query.apiKey.findFirst({
			where: {
				id: {
					eq: "test-api-key-id",
				},
			},
		});
		expect(apiKey).not.toBeNull();
		expect(apiKey?.status).toBe("inactive");
	});
});
