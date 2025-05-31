import { z } from "zod";

import type { tables } from "./index";
import type { InferSelectModel } from "drizzle-orm";

export const errorDetails = z.object({
	statusCode: z.number(),
	statusText: z.string(),
	responseText: z.string(),
});

export type Log = InferSelectModel<typeof tables.log>;
export type ApiKey = InferSelectModel<typeof tables.apiKey>;
export type Project = InferSelectModel<typeof tables.project>;
