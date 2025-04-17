import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	user: {
		tokens: r.many.token(),
	},
	token: {
		user: r.one.user({
			from: r.token.userId,
			to: r.user.id,
		}),
	},
}));
