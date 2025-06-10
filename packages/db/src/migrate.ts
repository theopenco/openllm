import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Run database migrations using drizzle-orm
 * This function connects to the database and applies all pending migrations
 */
export async function runMigrations(): Promise<void> {
	const databaseUrl =
		process.env.DATABASE_URL || "postgres://postgres:pw@localhost:5389/db";

	console.log("🔄 Starting database migrations...");

	// Create a drizzle instance for migrations
	const migrationDb = drizzle({ connection: databaseUrl });

	// Get the directory of this file and resolve the migrations folder
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const migrationsFolder = path.resolve(__dirname, "../migrations");

	try {
		// Run migrations from the migrations folder
		await migrate(migrationDb, { migrationsFolder });
		console.log("✅ Database migrations completed successfully");
	} catch (error) {
		console.error("❌ Database migration failed:", error);
		throw error;
	} finally {
		// Close the connection pool
		await pool.end();
	}
}
