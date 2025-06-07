import { $api } from "@/lib/fetch-client";

export interface Organization {
	id: string;
	name: string;
	credits: number;
	plan: "free" | "pro";
	planExpiresAt: string | null;
	retentionLevel: "retain" | "none";
	createdAt: string;
	updatedAt: string;
	autoTopUpEnabled?: boolean;
	autoTopUpThreshold?: string | null;
	autoTopUpAmount?: string | null;
}

export interface OrganizationsResponse {
	organizations: Organization[];
}

export function useDefaultOrganization() {
	const { data, error } = $api.useSuspenseQuery("get", "/orgs");

	if (!data?.organizations || data.organizations.length === 0) {
		return {
			data: null,
			error: error || new Error("No organizations found"),
		};
	}

	return { data: data.organizations[0], error };
}
