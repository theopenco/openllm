import { serve } from "@hono/node-server";

import { app } from "./index";
import { startWorker } from "./worker";

const port = 4001; // +process.env.PORT ||

console.log("listening on port", port);

startWorker();

serve({
	port,
	fetch: app.fetch,
});
