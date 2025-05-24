import { db, tables } from "@openllm/db";
import { models, providers } from "@openllm/models";
import "dotenv/config";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { app } from ".";
import { flushLogs, waitForLogs } from "./test-utils/test-helpers";

const testModels = models
	.filter((model) => !["custom", "auto"].includes(model.model))
	.map((model) => ({
		model: model.model,
		providers: model.providers,
	}));

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

	function getProviderEnvVar(provider: string): string | undefined {
		const envMap: Record<string, string> = {
			openai: "OPENAI_API_KEY",
			anthropic: "ANTHROPIC_API_KEY",
			"google-vertex": "VERTEX_API_KEY",
			"google-ai-studio": "GOOGLE_AI_STUDIO_API_KEY",
			"inference.net": "INFERENCE_NET_API_KEY",
			"kluster.ai": "KLUSTER_AI_API_KEY",
		};
		return process.env[envMap[provider]];
	}

	async function createProviderKey(provider: string, token: string) {
		await db.insert(tables.providerKey).values({
			id: `provider-key-${provider}`,
			token,
			provider,
			projectId: "project-id",
		});
	}

	async function createApiKey() {
		await db.insert(tables.apiKey).values({
			id: "token-id",
			token: "real-token",
			projectId: "project-id",
			description: "Test API Key",
		});
	}

	function validateResponse(json: any, provider: string) {
		expect(json).toHaveProperty("choices.[0].message.content");

		expect(json).toHaveProperty("usage.prompt_tokens");
		expect(json).toHaveProperty("usage.completion_tokens");
		expect(json).toHaveProperty("usage.total_tokens");
	}

	async function validateLogs(expectedProvider: string) {
		const logs = await waitForLogs(1);
		expect(logs.length).toBe(1);
		expect(logs[0].usedProvider).toBe(expectedProvider);

		if (expectedProvider === "anthropic") {
			expect(logs[0].unifiedFinishReason).not.toBeNull();
		}

		expect(logs[0].finishReason).not.toBeNull();
		return logs[0];
	}

	test.each(testModels)(
		"/v1/chat/completions with $model",
		async ({ model, providers: modelProviders }) => {
			let testRan = false;

			for (const provider of modelProviders) {
				const envVar = getProviderEnvVar(provider);
				if (!envVar) {
					console.log(`Skipping ${model} on ${provider} - no API key provided`);
					continue;
				}

				console.log(`Testing ${model} on ${provider}`);
				testRan = true;

				await createApiKey();
				await createProviderKey(provider, envVar);

				const requestModel =
					provider === "openai" ? model : `${provider}/${model}`;

				const res = await app.request("/v1/chat/completions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer real-token`,
					},
					body: JSON.stringify({
						model: requestModel,
						messages: [
							{
								role: "user",
								content: "Hello, just reply 'OK'!",
							},
						],
					}),
				});

				expect(res.status).toBe(200);
				const json = await res.json();
				validateResponse(json, provider);

				const log = await validateLogs(provider);
				expect(log.streamed).toBe(false);

				expect(log.inputCost).not.toBeNull();
				expect(log.outputCost).not.toBeNull();
				expect(log.cost).not.toBeNull();

				await db.delete(tables.apiKey);
				await db.delete(tables.providerKey);
				await flushLogs();

				break;
			}

			if (!testRan) {
				console.log(
					`Skipped all providers for ${model} - no API keys available`,
				);
			}
		},
	);

	test.each(testModels)(
		"/v1/chat/completions streaming with $model",
		async ({ model, providers: modelProviders }) => {
			const streamingProviders = modelProviders.filter((provider) => {
				const providerInfo = providers.find((p) => p.id === provider);
				return providerInfo?.streaming === true;
			});

			let testRan = false;

			for (const provider of streamingProviders) {
				const envVar = getProviderEnvVar(provider);
				if (!envVar) {
					console.log(
						`Skipping streaming ${model} on ${provider} - no API key provided`,
					);
					continue;
				}

				console.log(`Testing streaming ${model} on ${provider}`);
				testRan = true;

				await createApiKey();
				await createProviderKey(provider, envVar);

				const requestModel =
					provider === "openai" ? model : `${provider}/${model}`;

				const res = await app.request("/v1/chat/completions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer real-token`,
					},
					body: JSON.stringify({
						model: requestModel,
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

				const log = await validateLogs(provider);
				expect(log.streamed).toBe(true);

				if (provider === "anthropic") {
					expect(log.inputCost).not.toBeNull();
					expect(log.outputCost).not.toBeNull();
					expect(log.cost).not.toBeNull();
				}

				await db.delete(tables.apiKey);
				await db.delete(tables.providerKey);
				await flushLogs();

				break;
			}

			if (!testRan) {
				console.log(
					`Skipped streaming for ${model} - no streaming providers available or no API keys`,
				);
			}
		},
	);
});

async function readAll(stream: ReadableStream<Uint8Array> | null) {
	if (!stream) {
		return;
	}
	const reader = stream.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			// console.log(new TextDecoder().decode(value));
		}
	} finally {
		reader.releaseLock();
	}
}
