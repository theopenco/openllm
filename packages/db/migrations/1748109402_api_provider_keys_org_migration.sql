-- Rename project_id to organization_id in api_key table
ALTER TABLE "api_key" RENAME COLUMN "project_id" TO "organization_id";

-- Add foreign key constraint to api_key.organization_id
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_organization_id_fkey" 
FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;

-- Rename project_id to organization_id in provider_key table
ALTER TABLE "provider_key" RENAME COLUMN "project_id" TO "organization_id";

-- Add foreign key constraint to provider_key.organization_id
ALTER TABLE "provider_key" ADD CONSTRAINT "provider_key_organization_id_fkey" 
FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
