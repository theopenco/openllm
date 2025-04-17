import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	user: {
		userOrganizations: r.many.userOrganization(),
	},
	organization: {
		userOrganizations: r.many.userOrganization(),
		tokens: r.many.token(),
	},
	userOrganization: {
		user: r.one.user({
			from: r.userOrganization.userId,
			to: r.user.id,
		}),
		organization: r.one.organization({
			from: r.userOrganization.organizationId,
			to: r.organization.id,
		}),
	},
	token: {
		organization: r.one.organization({
			from: r.token.organizationId,
			to: r.organization.id,
		}),
	},
}));
