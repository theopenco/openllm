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
		apiKeys: r.many.apiKey(),
		logs: r.many.log(),
	},
	apiKey: {
		project: r.one.project({
			from: r.apiKey.projectId,
			to: r.project.id,
		}),
		logs: r.many.log(),
	},
	providerKey: {
		project: r.one.project({
			from: r.providerKey.projectId,
			to: r.project.id,
		}),
		logs: r.many.log(),
	},
	log: {
		project: r.one.project({
			from: r.log.projectId,
			to: r.project.id,
		}),
		apiKey: r.one.apiKey({
			from: r.log.apiKeyId,
			to: r.apiKey.id,
		}),
		providerKey: r.one.providerKey({
			from: r.log.providerKeyId,
			to: r.providerKey.id,
		}),
	},
}));
