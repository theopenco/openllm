-- Rename project_id to organization_id in provider_key table
ALTER TABLE provider_key RENAME COLUMN project_id TO organization_id;
