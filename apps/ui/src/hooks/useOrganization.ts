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
	return $api.useQuery("get", "/orgs", {
		select: (data: { organizations: Organization[] }) => {
			if (!data.organizations || data.organizations.length === 0) {
				throw new Error("No organizations found");
			}
			return data.organizations[0];
		},
	});
}
