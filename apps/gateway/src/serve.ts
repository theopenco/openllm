import { serve } from "@hono/node-server";

import { app } from "./index";
import { startWorker } from "./worker";

const port = Number(process.env.PORT) || 4001;

console.log("listening on port", port);

void startWorker();

serve({
	port,
	fetch: app.fetch,
});
