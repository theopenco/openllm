import type { Variables } from "@llmgateway/auth";
import type { Env } from "hono/types";

export interface ServerTypes extends Env {
	Variables: Variables;
}
