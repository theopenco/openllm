import { expect, test } from "vitest";

import { app } from ".";

test("/", async () => {
	const res = await app.request("/");
	expect(res.status).toBe(200);
	const text = await res.text();
	expect(text).toMatch(/"message":"OK"/);
});

test("/content/user/me", async () => {
	const res = await app.request("/content/user/me");
	expect(res.status).toBe(401);
	const text = await res.text();
	expect(text).toMatch(/Unauthorized/);
});
