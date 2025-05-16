import { useSuspenseQuery } from "@tanstack/react-query";

const API_BASE_ORGS = "/api/content/orgs";
const API_BASE_PROJECTS = "/api/content/projects";

export interface Project {
	id: string;
	name: string;
	cachingEnabled: boolean;
	cacheDurationSeconds: number;
	organizationId: string;
}

export interface Organization {
	id: string;
	name: string;
}

export function useDefaultProject() {
	return useSuspenseQuery({
		queryKey: ["defaultProject"],
		queryFn: async () => {
			const orgsRes = await fetch(API_BASE_ORGS, {
				credentials: "include",
			});

			if (!orgsRes.ok) {
				const errorText = await orgsRes.text();
				throw new Error(`Failed to fetch organizations: ${errorText}`);
			}

			const orgsData: { organizations: Organization[] } = await orgsRes.json();

			if (!orgsData.organizations || orgsData.organizations.length === 0) {
				throw new Error("No organizations found");
			}

			const defaultOrg = orgsData.organizations[0];

			const projectsRes = await fetch(
				`${API_BASE_PROJECTS}?organizationId=${defaultOrg.id}`,
				{
					credentials: "include",
				},
			);

			if (!projectsRes.ok) {
				const errorText = await projectsRes.text();
				throw new Error(`Failed to fetch projects: ${errorText}`);
			}

			const projectsData: { projects: Project[] } = await projectsRes.json();

			if (!projectsData.projects || projectsData.projects.length === 0) {
				throw new Error("No projects found for the default organization");
			}

			return projectsData.projects[0];
		},
	});
}
