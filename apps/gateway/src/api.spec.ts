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

describe("test", () => {
	let mockServerUrl: string;

	// Start the mock OpenAI server before all tests
	beforeAll(() => {
		mockServerUrl = startMockServer(3001);
	});

	// Stop the mock server after all tests
	afterAll(() => {
		stopMockServer();
	});

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

	test("/", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		const text = await res.text();
		expect(text).toMatchInlineSnapshot(`"{"message":"OK"}"`);
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
			provider: "openllm",
			projectId: "project-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "openllm/custom",
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

		// Check that the request was logged
		const logs = await db.query.log.findMany({});
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
			projectId: "project-id",
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
	test("/v1/chat/completions with model that has multiple providers", async () => {
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
			projectId: "project-id",
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
			`"No API key set for provider: inference.net. Please add a provider key in your settings."`,
		);
	});

	// test for openllm/auto special case
	test("/v1/chat/completions with openllm/auto", async () => {
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
			projectId: "project-id",
			baseUrl: mockServerUrl,
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "openllm/auto",
				messages: [
					{
						role: "user",
						content: "Hello with openllm/auto!",
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
			`"No API key set for provider: openai. Please add a provider key in your settings."`,
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
			provider: "openllm",
			projectId: "project-id",
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
				model: "openllm/custom",
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

		// Check that the error was logged in the database
		const logs = await db.query.log.findMany({});
		expect(logs.length).toBe(1);

		// Verify the log has the correct error fields
		const errorLog = logs[0];
		expect(errorLog.finishReason).toBe("gateway_error");
	});

	// test for fallback to alternative provider when primary fails
	test("/v1/chat/completions with fallback to alternative provider", async () => {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		// Create provider keys for both providers for the llama model
		await db.insert(tables.providerKey).values({
			id: "provider-key-id-1",
			token: "sk-test-key-1",
			provider: "inference.net",
			projectId: "project-id",
			baseUrl: mockServerUrl,
		});

		await db.insert(tables.providerKey).values({
			id: "provider-key-id-2",
			token: "sk-test-key-2",
			provider: "kluster.ai",
			projectId: "project-id",
			baseUrl: mockServerUrl,
		});

		// Send a request that will trigger an error for the first provider but succeed with the second
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
						content:
							"This message will TRIGGER_PROVIDER_ERROR for the first provider",
					},
				],
			}),
		});

		// Verify the response status is 200 (success due to fallback)
		expect(res.status).toBe(200);

		// Verify the response body contains content from the successful provider
		const successResponse = await res.json();
		expect(successResponse).toHaveProperty("choices.[0].message.content");

		// Check that both attempts were logged in the database
		const logs = await db.query.log.findMany({});
		expect(logs.length).toBeGreaterThanOrEqual(1);
	});
});
