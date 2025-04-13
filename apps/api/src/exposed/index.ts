import { Hono } from "hono";

import { auth } from "./auth";

import type { ServerTypes } from "../vars";

export const exposed = new Hono<ServerTypes>();

exposed.route("/auth", auth);
