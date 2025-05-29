import { eq } from "drizzle-orm";

import { db, tables } from "./src";

/**
 * Cleanup script to fix inconsistent data before adding foreign key constraints
 * Specifically handles log entries with invalid provider_key_id references
 */
async function cleanup() {
	console.log("Starting data cleanup...");

	const providerKeys = await db.select().from(tables.providerKey);
	const providerKeyIds = new Set(providerKeys.map((pk) => pk.id));

	const logs = await db.select().from(tables.log);
	const invalidLogs = logs.filter(
		(log) => log.providerKeyId && !providerKeyIds.has(log.providerKeyId),
	);

	console.log(
		`Found ${invalidLogs.length} logs with invalid provider key references`,
	);

	if (invalidLogs.length > 0) {
		for (const log of invalidLogs) {
			await db.delete(tables.log).where(eq(tables.log.id, log.id));
		}
		console.log(`Deleted ${invalidLogs.length} invalid logs`);

		/*
    if (providerKeys.length > 0) {
      const validProviderId = providerKeys[0].id;
      for (const log of invalidLogs) {
        await db
          .update(tables.log)
          .set({ providerKeyId: validProviderId })
          .where(tables.log.id.equals(log.id));
      }
      console.log(`Updated ${invalidLogs.length} logs to use valid provider key`);
    }
    */
	}

	const organizations = await db.select().from(tables.organization);
	const organizationIds = new Set(organizations.map((org) => org.id));

	const projects = await db.select().from(tables.project);
	const invalidProjects = projects.filter(
		(project) => !organizationIds.has(project.organizationId),
	);

	if (invalidProjects.length > 0) {
		console.log(
			`Found ${invalidProjects.length} projects with invalid organization references`,
		);
		for (const project of invalidProjects) {
			await db.delete(tables.project).where(eq(tables.project.id, project.id));
		}
		console.log(`Deleted ${invalidProjects.length} invalid projects`);
	}

	const projectIds = new Set(projects.map((project) => project.id));

	const apiKeys = await db.select().from(tables.apiKey);
	const invalidApiKeys = apiKeys.filter(
		(apiKey) => !projectIds.has(apiKey.projectId),
	);

	if (invalidApiKeys.length > 0) {
		console.log(
			`Found ${invalidApiKeys.length} API keys with invalid project references`,
		);
		for (const apiKey of invalidApiKeys) {
			await db.delete(tables.apiKey).where(eq(tables.apiKey.id, apiKey.id));
		}
		console.log(`Deleted ${invalidApiKeys.length} invalid API keys`);
	}

	console.log("Data cleanup completed successfully");
}

void cleanup().catch((error) => {
	console.error("Error during cleanup:", error);
	process.exit(1);
});
