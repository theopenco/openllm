import { expect, test } from "vitest";

import { app } from ".";

test("/", async () => {
	const res = await app.request("/");
	expect(res.status).toBe(200);
	const text = await res.text();
	expect(text).toMatch(/"message":"OK"/);
});

// TODO make this an e2e test
test.skip("/v1/chat/completions e2e success", async () => {
	const res = await app.request("/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
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
});

// invalid model test
test("/v1/chat/completions invalid model", async () => {
	const res = await app.request("/v1/chat/completions", {
		method: "POST",
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
