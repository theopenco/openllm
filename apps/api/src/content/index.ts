import { Hono } from "hono";

import { user } from "./user";

import type { ServerTypes } from "../vars";

export const content = new Hono<ServerTypes>();

content.route("/user", user);
