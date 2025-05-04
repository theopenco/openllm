import type { Variables } from "@openllm/auth";
import type { Env } from "hono/types";

export interface ServerTypes extends Env {
	Variables: Variables;
}
