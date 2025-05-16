import { db, tables } from "@openllm/db";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { app } from ".";

describe("e2e tests with real provider keys", () => {
	afterEach(async () => {
		await db.delete(tables.user);
		await db.delete(tables.account);
		await db.delete(tables.session);
		await db.delete(tables.verification);
		await db.delete(tables.organization);
		await db.delete(tables.userOrganization);
		await db.delete(tables.project);
		await db.delete(tables.apiKey);
		await db.delete(tables.providerKey);
		await db.delete(tables.log);
	});

	beforeEach(async () => {
		await db.insert(tables.user).values({
			id: "user-id",
			name: "user",
			email: "user",
		});

		await db.insert(tables.organization).values({
			id: "org-id",
			name: "Test Organization",
		});

		await db.insert(tables.userOrganization).values({
			id: "user-org-id",
			userId: "user-id",
			organizationId: "org-id",
		});

		await db.insert(tables.project).values({
			id: "project-id",
			name: "Test Project",
			organizationId: "org-id",
		});
	});

	test("/v1/chat/completions with OpenAI", async () => {
		if (!process.env.OPENAI_API_KEY) {
			console.log("Skipping OpenAI test - no API key provided");
			return;
		}

		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: process.env.OPENAI_API_KEY,
			provider: "openai",
			projectId: "project-id",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: [
					{
						role: "user",
						content: "Hello! This is an e2e test.",
					},
				],
			}),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");
		expect(json).toHaveProperty("usage.prompt_tokens");
		expect(json).toHaveProperty("usage.completion_tokens");
		expect(json).toHaveProperty("usage.total_tokens");

		const logs = await db.query.log.findMany({});
		expect(logs.length).toBe(1);
		expect(logs[0].finishReason).toBe("stop");
		expect(logs[0].usedProvider).toBe("openai");
	});

	test("/v1/chat/completions with Anthropic", async () => {
		if (!process.env.ANTHROPIC_API_KEY) {
			console.log("Skipping Anthropic test - no API key provided");
			return;
		}

		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: process.env.ANTHROPIC_API_KEY,
			provider: "anthropic",
			projectId: "project-id",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "anthropic/claude-3-haiku",
				messages: [
					{
						role: "user",
						content: "Hello! This is an e2e test.",
					},
				],
			}),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("content");

		const logs = await db.query.log.findMany({});
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("anthropic");
	});

	test("/v1/chat/completions with Google Vertex", async () => {
		if (!process.env.VERTEX_API_KEY) {
			console.log("Skipping Google Vertex test - no API key provided");
			return;
		}

		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: process.env.VERTEX_API_KEY,
			provider: "google-vertex",
			projectId: "project-id",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "google-vertex/gemini-2.0-flash",
				messages: [
					{
						role: "user",
						content: "Hello! This is an e2e test.",
					},
				],
			}),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");

		const logs = await db.query.log.findMany({});
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("google-vertex");
	});
});
