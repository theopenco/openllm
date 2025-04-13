import type { Env } from "hono/types";

interface Variables {
	// TODO
	jwtPayload: {
		sub: string;
	};
}

export interface ServerTypes extends Env {
	Variables: Variables;
}
