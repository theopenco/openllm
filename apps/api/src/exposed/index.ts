import { OpenAPIHono } from "@hono/zod-openapi";

import { signin } from "./signin";

import type { ServerTypes } from "../vars";

export const exposed = new OpenAPIHono<ServerTypes>();

exposed.route("/auth", signin);
