import { db, tables } from "@openllm/db";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { app } from "..";
import { createTestUser, deleteAll } from "../testing";

describe("activity route", () => {
	let token: string;

	afterEach(async () => {
		await deleteAll();
	});

	beforeEach(async () => {
		token = await createTestUser();

		// Create test organizations
		await db.insert(tables.organization).values([
			{
				id: "test-org-id",
				name: "Test Organization",
			},
			{
				id: "test-org-id-2",
				name: "Test Organization 2",
			},
		]);

		// Associate user with organizations
		await db.insert(tables.userOrganization).values([
			{
				id: "test-user-org-id",
				userId: "test-user-id",
				organizationId: "test-org-id",
			},
			{
				id: "test-user-org-id-2",
				userId: "test-user-id",
				organizationId: "test-org-id-2",
			},
		]);

		// Create test projects
		await db.insert(tables.project).values([
			{
				id: "test-project-id",
				name: "Test Project",
				organizationId: "test-org-id",
			},
			{
				id: "test-project-id-2",
				name: "Test Project 2",
				organizationId: "test-org-id-2",
			},
		]);

		// Create test API keys
		await db.insert(tables.apiKey).values([
			{
				id: "test-api-key-id",
				token: "test-token",
				projectId: "test-project-id",
				description: "Test API Key",
			},
			{
				id: "test-api-key-id-2",
				token: "test-token-2",
				projectId: "test-project-id-2",
				description: "Test API Key 2",
			},
		]);

		// Create test provider keys
		await db.insert(tables.providerKey).values([
			{
				id: "test-provider-key-id",
				token: "test-provider-token",
				provider: "openai",
				projectId: "test-project-id",
			},
			{
				id: "test-provider-key-id-2",
				token: "test-provider-token-2",
				provider: "anthropic",
				projectId: "test-project-id-2",
			},
		]);

		// Create test logs
		await db.insert(tables.log).values([
			{
				id: "test-log-id-1",
				projectId: "test-project-id",
				apiKeyId: "test-api-key-id",
				providerKeyId: "test-provider-key-id",
				duration: 100,
				requestedModel: "gpt-4",
				requestedProvider: "openai",
				usedModel: "gpt-4",
				usedProvider: "openai",
				responseSize: 1000,
				content: "Test response content",
				finishReason: "stop",
				promptTokens: 10,
				completionTokens: 20,
				totalTokens: 30,
				temperature: 0.7,
				maxTokens: 100,
				messages: JSON.stringify([{ role: "user", content: "Hello" }]),
			},
			{
				id: "test-log-id-2",
				projectId: "test-project-id-2",
				apiKeyId: "test-api-key-id-2",
				providerKeyId: "test-provider-key-id-2",
				duration: 200,
				requestedModel: "claude-3-haiku",
				requestedProvider: "anthropic",
				usedModel: "claude-3-haiku",
				usedProvider: "anthropic",
				responseSize: 2000,
				content: "Test response content 2",
				finishReason: "stop",
				promptTokens: 20,
				completionTokens: 40,
				totalTokens: 60,
				temperature: 0.8,
				maxTokens: 200,
				messages: JSON.stringify([{ role: "user", content: "Hello 2" }]),
			},
		]);
	});

	test("should return 401 when not authenticated", async () => {
		const res = await app.request("/content/activity");
		expect(res.status).toBe(401);
	});

	// Tests for the filter functionality
	describe("filter functionality", () => {
		test("should filter logs by projectId", async () => {
			const params = new URLSearchParams({ projectId: "test-project-id" });
			const res = await app.request("/content/activity?" + params, {
				method: "GET",
				headers: {
					Cookie: token,
				},
			});

			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.logs.length).toBe(1);
			expect(json.logs[0].projectId).toBe("test-project-id");
		});

		test("should filter by second projectId", async () => {
			const params = new URLSearchParams({ projectId: "test-project-id-2" });
			const res = await app.request("/content/activity?" + params, {
				method: "GET",
				headers: {
					Cookie: token,
				},
			});

			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.logs.length).toBe(1);
			expect(json.logs[0].projectId).toBe("test-project-id-2");
		});
	});
});
