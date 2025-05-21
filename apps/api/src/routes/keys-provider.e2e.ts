import { db, tables } from "@openllm/db";
import "dotenv/config";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { app } from "..";
import { createTestUser, deleteAll } from "../testing";

describe("e2e tests for provider keys", () => {
	let token: string;

	afterEach(async () => {
		await deleteAll();
	});

	beforeEach(async () => {
		token = await createTestUser();

		await db.insert(tables.organization).values({
			id: "test-org-id",
			name: "Test Organization",
		});

		await db.insert(tables.userOrganization).values({
			id: "test-user-org-id",
			userId: "test-user-id",
			organizationId: "test-org-id",
		});

		await db.insert(tables.project).values({
			id: "test-project-id",
			name: "Test Project",
			organizationId: "test-org-id",
		});
	});

	test("POST /keys/provider with OpenAI key", async () => {
		if (!process.env.OPENAI_API_KEY) {
			console.log("Skipping OpenAI test - no API key provided");
			return;
		}

		const res = await app.request("/keys/provider", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: token,
			},
			body: JSON.stringify({
				provider: "openai",
				token: process.env.OPENAI_API_KEY,
			}),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("providerKey");
		expect(json.providerKey.provider).toBe("openai");
		expect(json.providerKey.token).toBe(process.env.OPENAI_API_KEY);

		const providerKey = await db.query.providerKey.findFirst({
			where: {
				provider: {
					eq: "openai",
				},
			},
		});
		expect(providerKey).not.toBeNull();
		expect(providerKey?.provider).toBe("openai");
		expect(providerKey?.token).toBe(process.env.OPENAI_API_KEY);
	});

	test("POST /keys/provider with Anthropic key", async () => {
		if (!process.env.ANTHROPIC_API_KEY) {
			console.log("Skipping Anthropic test - no API key provided");
			return;
		}

		const res = await app.request("/keys/provider", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: token,
			},
			body: JSON.stringify({
				provider: "anthropic",
				token: process.env.ANTHROPIC_API_KEY,
			}),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("providerKey");
		expect(json.providerKey.provider).toBe("anthropic");
		expect(json.providerKey.token).toBe(process.env.ANTHROPIC_API_KEY);

		const providerKey = await db.query.providerKey.findFirst({
			where: {
				provider: {
					eq: "anthropic",
				},
			},
		});
		expect(providerKey).not.toBeNull();
		expect(providerKey?.provider).toBe("anthropic");
		expect(providerKey?.token).toBe(process.env.ANTHROPIC_API_KEY);
	});

	test("POST /keys/provider with custom baseUrl", async () => {
		if (!process.env.OPENAI_API_KEY) {
			console.log("Skipping custom baseUrl test - no API key provided");
			return;
		}

		const customBaseUrl = "https://api.custom-openai.example.com";
		const res = await app.request("/keys/provider", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: token,
			},
			body: JSON.stringify({
				provider: "openai",
				token: process.env.OPENAI_API_KEY,
				baseUrl: customBaseUrl,
			}),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("providerKey");
		expect(json.providerKey.provider).toBe("openai");
		expect(json.providerKey.baseUrl).toBe(customBaseUrl);

		const providerKey = await db.query.providerKey.findFirst({
			where: {
				provider: {
					eq: "openai",
				},
			},
		});
		expect(providerKey).not.toBeNull();
		expect(providerKey?.provider).toBe("openai");
		expect(providerKey?.baseUrl).toBe(customBaseUrl);
	});
});
