import {
	db,
	log,
	organization,
	project,
	apiKey,
	providerKey,
	user,
	userOrganization,
} from "@openllm/db";
import { beforeEach, describe, expect, test } from "vitest";

import { app } from ".";

describe("test", () => {
	beforeEach(async () => {
		await db.delete(log);
		await db.delete(user);
		await db.delete(apiKey);
		await db.delete(providerKey);
		await db.delete(userOrganization);
		await db.delete(project);
		await db.delete(organization);

		await db.insert(user).values({
			id: "user-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			name: "user",
			email: "user",
			password: "user",
		});

		await db.insert(organization).values({
			id: "org-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			name: "Test Organization",
		});

		await db.insert(userOrganization).values({
			id: "user-org-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			userId: "user-id",
			organizationId: "org-id",
		});

		await db.insert(project).values({
			id: "project-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
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

	// TODO make this an e2e test
	test("/v1/chat/completions e2e success", async () => {
		await db.insert(apiKey).values({
			id: "token-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: "real-token",
			projectId: "project-id",
		});

		await db.insert(providerKey).values({
			id: "provider-key-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: process.env.OPENAI_API_KEY || "sk-test-key",
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
				model: "gpt-4o-mini",
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

		// check for db log
		const logs = await db.query.log.findMany({});
		console.log("db logs", JSON.stringify(logs, null, 2));
		expect(logs.length).toBe(1);
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
		await db.insert(apiKey).values({
			id: "token-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: "real-token",
			projectId: "project-id",
		});

		await db.insert(providerKey).values({
			id: "provider-key-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: process.env.OPENAI_API_KEY || "sk-test-key",
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
		await db.insert(apiKey).values({
			id: "token-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: "real-token",
			projectId: "project-id",
		});

		await db.insert(providerKey).values({
			id: "provider-key-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: process.env.OPENAI_API_KEY || "sk-test-key",
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
		// Since the implementation only supports openai provider currently,
		// this should return a 500 error for unsupported provider
		expect(res.status).toBe(500);
		const msg = await res.text();
		expect(msg).toMatchInlineSnapshot(
			`"could not use provider: inference.net"`,
		);
	});

	// test for openllm/auto special case
	test("/v1/chat/completions with openllm/auto", async () => {
		await db.insert(apiKey).values({
			id: "token-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: "real-token",
			projectId: "project-id",
		});

		await db.insert(providerKey).values({
			id: "provider-key-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: process.env.OPENAI_API_KEY || "sk-test-key",
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
		await db.insert(apiKey).values({
			id: "token-id",
			createdAt: new Date().toString(),
			updatedAt: new Date().toString(),
			token: "real-token",
			projectId: "project-id",
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
});
