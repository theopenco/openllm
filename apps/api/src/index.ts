import { Hono } from "hono";

export const app = new Hono();

app.get("/", (c) => {
	return c.json({ message: "Hello from Backend!" });
});
