import { db, tables } from "./src";

async function reset() {
	await Promise.all([
		db.delete(tables.log),
		db.delete(tables.apiKey),
		db.delete(tables.providerKey),
	]);

	await Promise.all([
		db.delete(tables.userOrganization),
		db.delete(tables.project),
	]);

	await Promise.all([
		db.delete(tables.organization),
		db.delete(tables.user),
		db.delete(tables.session),
		db.delete(tables.account),
		db.delete(tables.verification),
	]);
}

void reset();
