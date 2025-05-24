import { db, tables } from "@openllm/db";
import "dotenv/config";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { app } from ".";
import { flushLogs, waitForLogs } from "./test-utils/test-helpers";

describe("e2e tests with real provider keys", () => {
	afterEach(async () => {
		await Promise.all([
			db.delete(tables.user),
			db.delete(tables.account),
			db.delete(tables.session),
			db.delete(tables.verification),
			db.delete(tables.organization),
			db.delete(tables.userOrganization),
			db.delete(tables.project),
			db.delete(tables.apiKey),
			db.delete(tables.providerKey),
			db.delete(tables.log),
		]);
		await flushLogs();
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

		// Wait for the worker to process the log
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].finishReason).toBe("stop");
		expect(logs[0].usedProvider).toBe("openai");
	});

	test("/v1/chat/completions with OpenAI streaming", async () => {
		if (!process.env.OPENAI_API_KEY) {
			console.log("Skipping OpenAI streaming test - no API key provided");
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
						content: "Hello! This is a streaming e2e test.",
					},
				],
				stream: true,
			}),
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/event-stream");

		await readAll(res.body);

		// Wait for the worker to process the log
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("openai");
		expect(logs[0].streamed).toBe(true);
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
				model: "anthropic/claude-3-5-sonnet-20241022",
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

		// Wait for the worker to process the log
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("anthropic");
		expect(logs[0].finishReason).not.toBeNull();
		expect(logs[0].unifiedFinishReason).not.toBeNull();
	});

	test("/v1/chat/completions with Anthropic streaming", async () => {
		if (!process.env.ANTHROPIC_API_KEY) {
			console.log("Skipping Anthropic streaming test - no API key provided");
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
				model: "anthropic/claude-3-5-sonnet-20241022",
				messages: [
					{
						role: "user",
						content: "Hello! This is a streaming e2e test.",
					},
				],
				stream: true,
			}),
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/event-stream");

		await readAll(res.body);

		// Wait for the worker to process the log
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("anthropic");
		expect(logs[0].streamed).toBe(true);
		expect(logs[0].finishReason).not.toBeNull();
		expect(logs[0].unifiedFinishReason).not.toBeNull();
		expect(logs[0].inputCost).not.toBeNull();
		expect(logs[0].outputCost).not.toBeNull();
		expect(logs[0].cost).not.toBeNull();
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

		// Wait for the worker to process the log
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("google-vertex");
	});

	test("/v1/chat/completions with Google AI Studio", async () => {
		if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
			console.log("Skipping Google AI Studio test - no API key provided");
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
			token: process.env.GOOGLE_AI_STUDIO_API_KEY,
			provider: "google-ai-studio",
			projectId: "project-id",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "google-ai-studio/gemini-2.5-flash-preview-05-20",
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

		// Wait for the worker to process the log
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("google-ai-studio");
	});

	test("/v1/chat/completions with Google AI Studio streaming", async () => {
		if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
			console.log(
				"Skipping Google AI Studio streaming test - no API key provided",
			);
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
			token: process.env.GOOGLE_AI_STUDIO_API_KEY,
			provider: "google-ai-studio",
			projectId: "project-id",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "google-ai-studio/gemini-2.5-flash-preview-05-20",
				messages: [
					{
						role: "user",
						content: "Hello! This is a streaming e2e test.",
					},
				],
				stream: true,
			}),
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/event-stream");

		await readAll(res.body);

		// Wait for the worker to process the log
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("google-ai-studio");
		expect(logs[0].streamed).toBe(true);
	});
});

async function readAll(stream: ReadableStream<Uint8Array> | null) {
	if (!stream) {
		return;
	}
	for await (const chunk of stream) {
		console.log(chunk.toString());
	}
}
