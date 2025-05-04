import * as schema from "./schema";

export * from "./db";
export * from "./schema";

export * from "drizzle-orm";

export const tables = {
	...schema,
};
