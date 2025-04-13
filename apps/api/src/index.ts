import { Hono } from "hono";
import { jwt } from "hono/jwt";

import { content } from "./content";
import { exposed } from "./exposed";

import type { ServerTypes } from "./vars";

export const app = new Hono<ServerTypes>();

app.get("/", (c) => {
	return c.json({ message: "OK" });
});

app.use(
	"/auth/*",
	jwt({
		secret: process.env.JWT_SECRET || "auth-secret",
	}),
);
app.route("/content", content);

app.route("/public", exposed);
