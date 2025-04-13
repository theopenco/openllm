import { OpenAPIHono } from "@hono/zod-openapi";

import { auth } from "./auth";

import type { ServerTypes } from "../vars";

export const exposed = new OpenAPIHono<ServerTypes>();

exposed.route("/auth", auth);
