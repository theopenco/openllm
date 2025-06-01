import { $api } from "@/lib/fetch-client";

export interface Organization {
	id: string;
	name: string;
	credits: number;
	createdAt: string;
	updatedAt: string;
}

export interface OrganizationsResponse {
	organizations: Organization[];
}

export function useDefaultOrganization() {
	const { data, isLoading, error } = $api.useQuery("get", "/orgs");

	if (!data?.organizations || data.organizations.length === 0) {
		return {
			data: null,
			isLoading,
			error: error || new Error("No organizations found"),
		};
	}

	return { data: data.organizations[0], isLoading, error };
}
