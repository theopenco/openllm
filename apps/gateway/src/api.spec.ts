import { db, tables } from "@openllm/db";
import {
	afterEach,
	afterAll,
	beforeEach,
	beforeAll,
	describe,
	expect,
	test,
} from "vitest";

import { app } from ".";
import {
	startMockServer,
	stopMockServer,
} from "./test-utils/mock-openai-server";
import { flushLogs, waitForLogs } from "./test-utils/test-helpers";

describe("test", () => {
	let mockServerUrl: string;

	// Start the mock OpenAI server and mock log insertion before all tests
	beforeAll(() => {
		// Start the mock OpenAI server
		mockServerUrl = startMockServer(3001);
	});

	// Stop the mock server and restore mocks after all tests
	afterAll(() => {
		console.log("Stopping mock server...");
		stopMockServer();
	});

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

	test("/", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toHaveProperty("message", "OK");
		expect(data).toHaveProperty("health");
		expect(data.health).toHaveProperty("status");
		expect(data.health).toHaveProperty("redis");
		expect(data.health).toHaveProperty("database");
	});

	test("/v1/chat/completions e2e success", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider key with mock server URL as baseUrl
		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "sk-test-key",
			provider: "llmgateway",
			organizationId: "org-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "llmgateway/custom",
				messages: [
					{
						role: "user",
						content: "Hello!",
					},
				],
			}),
		});
		const json = await res.json();
		console.log(JSON.stringify(json, null, 2));
		expect(res.status).toBe(200);
		expect(json).toHaveProperty("choices.[0].message.content");
		expect(json.choices[0].message.content).toMatch(/Hello!/);

		// Wait for the worker to process the log and check that the request was logged
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].finishReason).toBe("stop");
		expect(logs[0].content).toMatch(/Hello!/);
	});

	// invalid model test
	test("/v1/chat/completions invalid model", async () => {
		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer fake`,
			},
			body: JSON.stringify({
				model: "invalid",
				messages: [
					{
						role: "user",
						content: "Hello!",
					},
				],
			}),
		});
		expect(res.status).toBe(400);
	});

	// test for missing Content-Type header
	test("/v1/chat/completions missing Content-Type header", async () => {
		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			// Intentionally not setting Content-Type header
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: "Hello!",
					},
				],
			}),
		});
		expect(res.status).toBe(415);
	});

	// test for missing Authorization header
	test("/v1/chat/completions missing Authorization header", async () => {
		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				// Intentionally not setting Authorization header
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: "Hello!",
					},
				],
			}),
		});
		expect(res.status).toBe(401);
	});

	// test for explicitly specifying a provider in the format "provider/model"
	test("/v1/chat/completions with explicit provider", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider key for OpenAI with mock server URL as baseUrl
		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "sk-test-key",
			provider: "openai",
			organizationId: "org-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "openai/gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: "Hello with explicit provider!",
					},
				],
			}),
		});
		expect(res.status).toBe(200);
	});

	// test for model with multiple providers (llama-3.3-70b-instruct)
	test.skip("/v1/chat/completions with model that has multiple providers", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "sk-test-key",
			provider: "openai",
			organizationId: "org-id",
		});

		// This test will use the default provider (first in the list) for llama-3.3-70b-instruct
		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "llama-3.3-70b-instruct",
				messages: [
					{
						role: "user",
						content: "Hello with multi-provider model!",
					},
				],
			}),
		});
		expect(res.status).toBe(400);
		const msg = await res.text();
		expect(msg).toMatchInlineSnapshot(
			`"No API key set for provider: inference.net. Please add a provider key in your settings or add credits and switch to credits or hybrid mode."`,
		);
	});

	// test for llmgateway/auto special case
	test("/v1/chat/completions with llmgateway/auto", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider key for OpenAI with mock server URL as baseUrl
		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "sk-test-key",
			provider: "openai",
			organizationId: "org-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "llmgateway/auto",
				messages: [
					{
						role: "user",
						content: "Hello with llmgateway/auto!",
					},
				],
			}),
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");
	});

	// test for missing provider API key
	test("/v1/chat/completions with missing provider API key", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: "Hello without provider key!",
					},
				],
			}),
		});
		expect(res.status).toBe(400);
		const errorMessage = await res.text();
		expect(errorMessage).toMatchInlineSnapshot(
			`"{"error":true,"status":400,"message":"No API key set for provider: openai. Please add a provider key in your settings or add credits and switch to credits or hybrid mode."}"`,
		);
	});

	// test for provider error response and error logging
	test("/v1/chat/completions with provider error response", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider key with mock server URL as baseUrl
		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "sk-test-key",
			provider: "llmgateway",
			organizationId: "org-id",
			baseUrl: mockServerUrl,
		});

		// Send a request that will trigger an error in the mock server
		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "llmgateway/custom",
				messages: [
					{
						role: "user",
						content: "This message will TRIGGER_ERROR in the mock server",
					},
				],
			}),
		});

		// Verify the response status is 500
		expect(res.status).toBe(500);

		// Verify the response body contains the error message
		const errorResponse = await res.json();
		expect(errorResponse).toHaveProperty("error");
		expect(errorResponse.error).toHaveProperty("message");
		expect(errorResponse.error).toHaveProperty("type", "gateway_error");

		// Wait for the worker to process the log and check that the error was logged in the database
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);

		// Verify the log has the correct error fields
		const errorLog = logs[0];
		expect(errorLog.finishReason).toBe("gateway_error");
	});

	// test for inference.net provider
	test.skip("/v1/chat/completions with inference.net provider", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider key for inference.net with mock server URL as baseUrl
		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "inference-test-key",
			provider: "inference.net",
			organizationId: "org-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "inference.net/llama-3.3-70b-instruct",
				messages: [
					{
						role: "user",
						content: "Hello with inference.net provider!",
					},
				],
			}),
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");

		// Check that the request was logged
		const logs = await waitForLogs();
		expect(logs.length).toBe(1);
		expect(logs[0].finishReason).toBe("stop");
		expect(logs[0].usedProvider).toBe("inference.net");
	});

	// test for kluster.ai provider
	test.skip("/v1/chat/completions with kluster.ai provider", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider key for kluster.ai with mock server URL as baseUrl
		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "kluster-test-key",
			provider: "kluster.ai",
			organizationId: "org-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "kluster.ai/llama-3.1-70b-instruct",
				messages: [
					{
						role: "user",
						content: "Hello with kluster.ai provider!",
					},
				],
			}),
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");

		// Check that the request was logged
		const logs = await waitForLogs();
		expect(logs.length).toBe(1);
		expect(logs[0].finishReason).toBe("stop");
		expect(logs[0].usedProvider).toBe("kluster.ai");
	});

	// test for model shared between inference.net and kluster.ai
	test.skip("/v1/chat/completions with model shared between inference.net and kluster.ai", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider key for inference.net (but not kluster.ai)
		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "inference-test-key",
			provider: "inference.net",
			organizationId: "org-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "llama-3.1-8b-instruct", // shared model
				messages: [
					{
						role: "user",
						content: "Hello with shared model!",
					},
				],
			}),
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");

		// Check that the request was logged and routed to inference.net
		const logs = await waitForLogs();
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe("inference.net");
	});

	// test for missing kluster.ai provider key
	test.skip("/v1/chat/completions with missing kluster.ai provider key", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "kluster.ai/llama-3.1-8b-instruct",
				messages: [
					{
						role: "user",
						content: "Hello without kluster.ai provider key!",
					},
				],
			}),
		});
		expect(res.status).toBe(400);
		const errorMessage = await res.text();
		expect(errorMessage).toContain("No API key set for provider: kluster.ai");
	});

	// test for together.ai provider
	test.skip("/v1/chat/completions with together.ai provider", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider key for together.ai with mock server URL as baseUrl
		await db.insert(tables.providerKey).values({
			id: "provider-key-id",
			token: "together-test-key",
			provider: "together.ai",
			organizationId: "org-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "together.ai/mistralai/Mixtral-8x7B-Instruct-v0.1",
				messages: [
					{
						role: "user",
						content: "Hello with together.ai provider!",
					},
				],
			}),
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");

		// Check that the request was logged
		const logs = await waitForLogs();
		expect(logs.length).toBe(1);
		expect(logs[0].finishReason).toBe("stop");
		expect(logs[0].usedProvider).toBe("together.ai");
	});

	// test for missing together.ai provider key
	test.skip("/v1/chat/completions with missing together.ai provider key", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "together.ai/mistralai/Mixtral-8x7B-Instruct-v0.1",
				messages: [
					{
						role: "user",
						content: "Hello without together.ai provider key!",
					},
				],
			}),
		});
		expect(res.status).toBe(400);
		const errorMessage = await res.text();
		expect(errorMessage).toContain("No API key set for provider: together.ai");
	});
});
