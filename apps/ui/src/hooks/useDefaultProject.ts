import { $api } from "@/lib/fetch-client";

export interface Project {
	id: string;
	name: string;
	cachingEnabled: boolean;
	cacheDurationSeconds: number;
	organizationId: string;
	mode: "api-keys" | "credits";
}

export interface Organization {
	id: string;
	name: string;
}

export function useDefaultProject() {
	const { data: orgsData } = $api.useSuspenseQuery("get", "/orgs");

	const defaultOrg = orgsData.organizations[0];

	const { data: projectsData } = $api.useSuspenseQuery(
		"get",
		"/orgs/{id}/projects",
		{
			params: {
				path: { id: defaultOrg.id },
			},
		},
	);

	return {
		data: projectsData.projects[0],
		queryKey: ["defaultProject"],
	};
}
