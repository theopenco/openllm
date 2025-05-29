import { db, tables } from "./src";

async function reset() {
	await db.delete(tables.log);
	await db.delete(tables.apiKey);
	await db.delete(tables.providerKey);
	await db.delete(tables.userOrganization);
	await db.delete(tables.project);

	await db.delete(tables.organization);
	await db.delete(tables.user);
	await db.delete(tables.session);
	await db.delete(tables.account);
	await db.delete(tables.verification);
}

void reset();
