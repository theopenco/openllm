import { serve } from "@hono/node-server";

import { app } from "./index";

const port = 4001; // +process.env.PORT ||

console.log("listening on port", port);

serve({
	port,
	fetch: app.fetch,
});
