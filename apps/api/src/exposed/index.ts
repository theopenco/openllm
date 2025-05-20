import { OpenAPIHono } from "@hono/zod-openapi";

import { authServer } from "./auth";

import type { ServerTypes } from "../vars";

export const exposed = new OpenAPIHono<ServerTypes>();

exposed.route("/auth", authServer);
