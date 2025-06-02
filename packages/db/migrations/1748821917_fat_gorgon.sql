ALTER TABLE "organization" ADD COLUMN "auto_top_up_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "auto_top_up_threshold" numeric(10, 2) DEFAULT '10.00';--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "auto_top_up_amount" numeric(10, 2) DEFAULT '10.00';--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "auto_top_up_last_triggered" timestamp;