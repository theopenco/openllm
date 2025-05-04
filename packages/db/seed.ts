import { db, tables } from "./src";

async function seed() {
	await db.insert(tables.user).values({
		id: "test-user-id",
		name: "Test User",
		email: "admin@example.com",
		emailVerified: true,
	});

	await db.insert(tables.account).values({
		id: "test-account-id",
		providerId: "credential",
		accountId: "test-account-id",
		password:
			"c11ef27a7f9264be08db228ebb650888:a4d985a9c6bd98608237fd507534424950aa7fc255930d972242b81cbe78594f8568feb0d067e95ddf7be242ad3e9d013f695f4414fce68bfff091079f1dc460",
		userId: "test-user-id",
	});

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

	await db.insert(tables.apiKey).values({
		id: "test-api-key-id",
		token: "test-token",
		projectId: "test-project-id",
	});

	await db.insert(tables.providerKey).values({
		id: "test-provider-key-id",
		token: "test-provider-token",
		provider: "openai",
		projectId: "test-project-id",
	});

	await db.insert(tables.log).values({
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
	});
}

void seed();
