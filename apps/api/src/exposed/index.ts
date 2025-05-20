import { OpenAPIHono } from "@hono/zod-openapi";

import { register } from "./register";

import type { ServerTypes } from "../vars";

export const exposed = new OpenAPIHono<ServerTypes>();

exposed.route("/auth", register);
