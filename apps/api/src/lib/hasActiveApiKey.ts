import { db, tables, eq, and } from "@openllm/db";

/**
 * Check if a user has at least one active (non-revoked) API key
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user has unlimited access
 */
export async function hasActiveApiKey(userId: string): Promise<boolean> {
	// Get user's organizations
	const userOrgs = await db
		.select({ organizationId: tables.userOrganization.organizationId })
		.from(tables.userOrganization)
		.where(eq(tables.userOrganization.userId, userId));

	if (!userOrgs.length) {
		return false;
	}

	const orgIds = userOrgs.map((org) => org.organizationId);

	// For each org, check if any projects have active API keys
	for (const orgId of orgIds) {
		const projectsInOrg = await db
			.select({ id: tables.project.id })
			.from(tables.project)
			.where(
				and(
					eq(tables.project.organizationId, orgId),
					eq(tables.project.status, "active"),
				),
			);

		for (const project of projectsInOrg) {
			const activeApiKey = await db
				.select({ id: tables.apiKey.id })
				.from(tables.apiKey)
				.where(
					and(
						eq(tables.apiKey.projectId, project.id),
						eq(tables.apiKey.status, "active"),
					),
				)
				.limit(1);

			if (activeApiKey.length > 0) {
				return true;
			}
		}
	}

	// FALLBACK: Try a more direct approach with a join query
	const directCheck = await db
		.select({
			apiKeyId: tables.apiKey.id,
			projectId: tables.project.id,
			orgId: tables.organization.id,
		})
		.from(tables.userOrganization)
		.innerJoin(
			tables.organization,
			eq(tables.userOrganization.organizationId, tables.organization.id),
		)
		.innerJoin(
			tables.project,
			eq(tables.organization.id, tables.project.organizationId),
		)
		.innerJoin(tables.apiKey, eq(tables.project.id, tables.apiKey.projectId))
		.where(
			and(
				eq(tables.userOrganization.userId, userId),
				eq(tables.project.status, "active"),
				eq(tables.apiKey.status, "active"),
			),
		)
		.limit(1);

	if (directCheck.length > 0) {
		return true;
	}

	return false;
}
