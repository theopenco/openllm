import { db, tables } from "@openllm/db";
import { providers } from "@openllm/models";
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

	const testProviders = providers
		.filter((provider) => provider.id !== "llmgateway")
		.map((provider) => ({
			providerId: provider.id,
			name: provider.name,
		}));

	test.each(testProviders)(
		"POST /keys/provider with $name key",
		async ({ providerId }) => {
			const envVar = getProviderEnvVar(providerId);
			if (!envVar) {
				console.log(`Skipping ${providerId} test - no API key provided`);
				return;
			}

			const res = await app.request("/keys/provider", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Cookie: token,
				},
				body: JSON.stringify({
					provider: providerId,
					token: envVar,
				}),
			});

			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json).toHaveProperty("providerKey");
			expect(json.providerKey.provider).toBe(providerId);
			expect(json.providerKey.token).toBe(envVar);

			const providerKey = await db.query.providerKey.findFirst({
				where: {
					provider: {
						eq: providerId,
					},
				},
			});
			expect(providerKey).not.toBeNull();
			expect(providerKey?.provider).toBe(providerId);
			expect(providerKey?.token).toBe(envVar);
		},
	);

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
