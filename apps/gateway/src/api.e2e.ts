import { db, tables, eq } from "@openllm/db";
import { models, providers } from "@openllm/models";
import "dotenv/config";
import { beforeEach, describe, expect, test } from "vitest";

import { app } from ".";
import {
	flushLogs,
	waitForLogs,
	getProviderEnvVar,
} from "./test-utils/test-helpers";

const testModels = models
	.filter((model) => !["custom", "auto"].includes(model.model))
	.flatMap((model) => {
		const testCases = [];

		// test all models
		testCases.push({
			model: model.model,
			providers: model.providers,
		});

		// Create entries for provider-specific requests using provider/model format
		for (const provider of model.providers) {
			testCases.push({
				model: `${provider.providerId}/${model.model}`,
				providers: [provider],
				originalModel: model.model, // Keep track of the original model for reference
			});
		}

		return testCases;
	});

const streamingModels = testModels.filter((m) =>
	m.providers.every((p) => {
		const provider = providers.find((pr) => pr.id === p.providerId);
		return provider?.streaming;
	}),
);

describe("e2e tests with real provider keys", () => {
	beforeEach(async () => {
		await flushLogs();
		await Promise.all([
			db.delete(tables.log),
			db.delete(tables.apiKey),
			db.delete(tables.providerKey),
		]);

		await Promise.all([
			db.delete(tables.userOrganization),
			db.delete(tables.project),
		]);

		await Promise.all([
			db.delete(tables.organization),
			db.delete(tables.user),
			db.delete(tables.account),
			db.delete(tables.session),
			db.delete(tables.verification),
		]);

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

		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});

		for (const provider of providers) {
			const envVar = getProviderEnvVar(provider.id);
			if (envVar) {
				await createProviderKey(provider.id, envVar, "api-keys");
				await createProviderKey(provider.id, envVar, "credits");
			}
		}
	});

	async function createProviderKey(
		provider: string,
		token: string,
		keyType: "api-keys" | "credits" = "api-keys",
	) {
		const keyId =
			keyType === "credits" ? `env-${provider}` : `provider-key-${provider}`;
		await db.insert(tables.providerKey).values({
			id: keyId,
			token,
			provider: provider.replace("env-", ""), // Remove env- prefix for the provider field
			organizationId: "org-id",
		});
	}

	function validateResponse(json: any) {
		expect(json).toHaveProperty("choices.[0].message.content");

		expect(json).toHaveProperty("usage.prompt_tokens");
		expect(json).toHaveProperty("usage.completion_tokens");
		expect(json).toHaveProperty("usage.total_tokens");
	}

	async function validateLogs() {
		const logs = await waitForLogs(1);
		expect(logs.length).toBeGreaterThan(0);

		console.log("logs", logs);

		const log = logs[0];
		expect(log.usedProvider).toBeTruthy();

		expect(log.finishReason).not.toBeNull();
		expect(log.unifiedFinishReason).not.toBeNull();
		expect(log.unifiedFinishReason).toBeTruthy();

		expect(log.usedModel).toBeTruthy();
		expect(log.requestedModel).toBeTruthy();

		return log;
	}

	test.each(testModels)(
		"/v1/chat/completions with $model",
		async ({ model }) => {
			const res = await app.request("/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer real-token`,
				},
				body: JSON.stringify({
					model: model,
					messages: [
						{
							role: "system",
							content: "You are a helpful assistant.",
						},
						{
							role: "user",
							content: "Hello, just reply 'OK'!",
						},
					],
				}),
			});

			const json = await res.json();
			console.log("response:", json);

			expect(res.status).toBe(200);
			validateResponse(json);

			const log = await validateLogs();
			expect(log.streamed).toBe(false);

			// expect(log.inputCost).not.toBeNull();
			// expect(log.outputCost).not.toBeNull();
			// expect(log.cost).not.toBeNull();

			await flushLogs(); // Process logs BEFORE deleting data
			await db.delete(tables.apiKey);
			await db.delete(tables.providerKey);
		},
	);

	test.each(streamingModels)(
		"/v1/chat/completions streaming with $model",
		async ({ model }) => {
			const res = await app.request("/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer real-token`,
				},
				body: JSON.stringify({
					model: model,
					messages: [
						{
							role: "system",
							content: "You are a helpful assistant.",
						},
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

			const streamResult = await readAll(res.body);

			expect(streamResult.hasValidSSE).toBe(true);
			expect(streamResult.eventCount).toBeGreaterThan(0);

			expect(streamResult.hasContent).toBe(true);

			const log = await validateLogs();
			expect(log.streamed).toBe(true);

			// expect(log.cost).not.toBeNull();
			// expect(log.cost).toBeGreaterThanOrEqual(0);
		},
	);

	test.each(
		testModels.filter((m) => {
			const modelDef = models.find((def) => def.model === m.model);
			return (modelDef as any)?.jsonOutput === true;
		}),
	)(
		"/v1/chat/completions with JSON output mode for $model",
		async ({ model }) => {
			const res = await app.request("/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer real-token`,
				},
				body: JSON.stringify({
					model: model,
					messages: [
						{
							role: "system",
							content:
								"You are a helpful assistant. Always respond with valid JSON.",
						},
						{
							role: "user",
							content: 'Return a JSON object with "message": "Hello World"',
						},
					],
					response_format: { type: "json_object" },
				}),
			});

			const json = await res.json();
			console.log("json", json);
			expect(res.status).toBe(200);
			expect(json).toHaveProperty("choices.[0].message.content");

			const content = json.choices[0].message.content;
			expect(() => JSON.parse(content)).not.toThrow();

			const parsedContent = JSON.parse(content);
			expect(parsedContent).toHaveProperty("message");
		},
	);

	test("JSON output mode error for unsupported model", async () => {
		const envVar = getProviderEnvVar("anthropic");
		if (!envVar) {
			console.log(
				"Skipping JSON output error test - no Anthropic API key provided",
			);
			return;
		}

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
						content: "Hello",
					},
				],
				response_format: { type: "json_object" },
			}),
		});

		expect(res.status).toBe(400);

		const text = await res.text();
		expect(text).toContain("does not support JSON output mode");

		await flushLogs(); // Process logs BEFORE deleting data
		await db.delete(tables.apiKey);
		await db.delete(tables.providerKey);
	});

	test("/v1/chat/completions with llmgateway/auto in credits mode", async () => {
		// require all provider keys to be set
		for (const provider of providers) {
			const envVar = getProviderEnvVar(provider.id);
			if (!envVar) {
				console.log(
					`Skipping llmgateway/auto in credits mode test - no API key provided for ${provider.id}`,
				);
				return;
			}
		}

		await db
			.update(tables.organization)
			.set({ credits: "1000" })
			.where(eq(tables.organization.id, "org-id"));

		await db
			.update(tables.project)
			.set({ mode: "credits" })
			.where(eq(tables.project.id, "project-id"));

		await db.insert(tables.apiKey).values({
			id: "token-credits",
			token: "credits-token",
			projectId: "project-id",
			description: "Test API Key for Credits",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer credits-token`,
			},
			body: JSON.stringify({
				model: "llmgateway/auto",
				messages: [
					{
						role: "user",
						content: "Hello with llmgateway/auto in credits mode!",
					},
				],
			}),
		});

		const json = await res.json();
		console.log("response:", json);
		expect(res.status).toBe(200);
		expect(json).toHaveProperty("choices.[0].message.content");

		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].requestedModel).toBe("auto");
		expect(logs[0].usedProvider).toBeTruthy();
		expect(logs[0].usedModel).toBeTruthy();
	});

	test("/v1/chat/completions with bare 'auto' model and credits", async () => {
		await db
			.update(tables.organization)
			.set({ credits: "1000" })
			.where(eq(tables.organization.id, "org-id"));

		await db
			.update(tables.project)
			.set({ mode: "credits" })
			.where(eq(tables.project.id, "project-id"));

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: "auto",
				messages: [
					{
						role: "user",
						content: "Hello! This is an auto test.",
					},
				],
			}),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");

		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].requestedModel).toBe("auto");
		expect(logs[0].usedProvider).toBeTruthy();
		expect(logs[0].usedModel).toBeTruthy();
	});

	test.skip("/v1/chat/completions with bare 'custom' model", async () => {
		const envVar = getProviderEnvVar("openai");
		if (!envVar) {
			console.log("Skipping custom model test - no OpenAI API key provided");
			return;
		}

		await db
			.update(tables.organization)
			.set({ credits: "1000" })
			.where(eq(tables.organization.id, "org-id"));

		await db
			.update(tables.project)
			.set({ mode: "credits" })
			.where(eq(tables.project.id, "project-id"));

		await db.insert(tables.providerKey).values({
			id: "provider-key-custom",
			provider: "llmgateway",
			token: envVar,
			baseUrl: "https://api.openai.com", // Use real OpenAI endpoint for testing
			status: "active",
			organizationId: "org-id",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await db.insert(tables.apiKey).values({
			id: "token-id-2",
			token: "real-token-2",
			projectId: "project-id",
			description: "Test API Key",
		});

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token-2`,
			},
			body: JSON.stringify({
				model: "custom",
				messages: [
					{
						role: "user",
						content: "Hello! This is a custom test.",
					},
				],
			}),
		});

		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json).toHaveProperty("choices.[0].message.content");

		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].requestedModel).toBe("custom");
		expect(logs[0].usedProvider).toBe("llmgateway");
		expect(logs[0].usedModel).toBe("custom");
	});

	test("Success when requesting multi-provider model without prefix", async () => {
		const multiProviderModel = models.find((m) => m.providers.length > 1);
		if (!multiProviderModel) {
			console.log(
				"Skipping multi-provider test - no multi-provider models found",
			);
			return;
		}

		const res = await app.request("/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer real-token`,
			},
			body: JSON.stringify({
				model: multiProviderModel.model,
				messages: [
					{
						role: "user",
						content: "Hello",
					},
				],
			}),
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		validateResponse(json);

		const log = await validateLogs();
		expect(log.streamed).toBe(false);
	});
});

test("Error when requesting provider-specific model name without prefix", async () => {
	// Create a fake model name that would be a provider-specific model name
	const res = await app.request("/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer real-token`,
		},
		body: JSON.stringify({
			model: "claude-3-sonnet-20240229",
			messages: [
				{
					role: "user",
					content: "Hello",
				},
			],
		}),
	});

	expect(res.status).toBe(400);
	const json = await res.json();
	console.log("Provider-specific model error:", JSON.stringify(json, null, 2));
	expect(json.message).toContain("not supported");
});

async function readAll(stream: ReadableStream<Uint8Array> | null): Promise<{
	hasContent: boolean;
	eventCount: number;
	hasValidSSE: boolean;
}> {
	if (!stream) {
		return { hasContent: false, eventCount: 0, hasValidSSE: false };
	}

	const reader = stream.getReader();
	let fullContent = "";
	let eventCount = 0;
	let hasValidSSE = false;
	let hasContent = false;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			const chunk = new TextDecoder().decode(value);
			fullContent += chunk;

			const lines = chunk.split("\n");
			for (const line of lines) {
				if (line.startsWith("data: ")) {
					eventCount++;
					hasValidSSE = true;

					if (line === "data: [DONE]") {
						continue;
					}

					try {
						const data = JSON.parse(line.substring(6));
						if (
							data.choices?.[0]?.delta?.content ||
							data.delta?.text ||
							data.candidates?.[0]?.content?.parts?.[0]?.text ||
							data.choices?.[0]?.finish_reason ||
							data.stop_reason ||
							data.delta?.stop_reason ||
							data.candidates?.[0]?.finishReason
						) {
							hasContent = true;
						}
					} catch (e) {}
				}
			}
		}
	} finally {
		reader.releaseLock();
	}

	return { hasContent, eventCount, hasValidSSE };
}
