import { verifyAuth } from "@hono/auth-js";
import { OpenAPIHono } from "@hono/zod-openapi";

import { user } from "./user";

import type { ServerTypes } from "../vars";

export const content = new OpenAPIHono<ServerTypes>();

content.use("/*", verifyAuth());

content.route("/user", user);
