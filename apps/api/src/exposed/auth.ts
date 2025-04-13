import { Hono } from "hono";

import type { ServerTypes } from "../vars";

export const auth = new Hono<ServerTypes>();

auth.post("/login", async (c) => {
	const { email, password } = await c.req.json();

	console.log("login", { email, password });

	return c.json({ message: "OK" });
});
