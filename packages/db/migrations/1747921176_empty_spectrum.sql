ALTER TABLE "organization" ADD COLUMN "credits" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "mode" text DEFAULT 'api-keys' NOT NULL;