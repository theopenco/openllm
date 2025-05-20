import { serve } from "@hono/node-server";

import { app } from "./index";

const port = Number(process.env.PORT) || 4002;

console.log("listening on port", port);

serve({
	port,
	fetch: app.fetch,
});
