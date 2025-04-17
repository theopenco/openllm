import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	user: {
		userOrganizations: r.many.userOrganization(),
	},
	organization: {
		userOrganizations: r.many.userOrganization(),
		projects: r.many.project(),
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
	project: {
		organization: r.one.organization({
			from: r.project.organizationId,
			to: r.organization.id,
		}),
		tokens: r.many.token(),
	},
	token: {
		project: r.one.project({
			from: r.token.projectId,
			to: r.project.id,
		}),
	},
}));
