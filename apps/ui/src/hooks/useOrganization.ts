import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api/orgs";

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

export async function fetchOrganizations(): Promise<OrganizationsResponse> {
	const res = await fetch(API_BASE, {
		credentials: "include",
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Failed to fetch organizations: ${errorText}`);
	}

	return await res.json();
}

export function useOrganizations() {
	return useQuery({
		queryKey: ["organizations"],
		queryFn: fetchOrganizations,
	});
}

export function useDefaultOrganization() {
	return useQuery({
		queryKey: ["defaultOrganization"],
		queryFn: async () => {
			const data = await fetchOrganizations();

			if (!data.organizations || data.organizations.length === 0) {
				throw new Error("No organizations found");
			}

			return data.organizations[0];
		},
	});
}
