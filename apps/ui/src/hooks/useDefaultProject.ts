import { useSuspenseQuery } from "@tanstack/react-query";

const API_BASE = "/api/content/organizations";

export interface Project {
	id: string;
	name: string;
	cachingEnabled: boolean;
	cacheDurationSeconds: number;
	organizationId: string;
}

export function useDefaultProject() {
	return useSuspenseQuery({
		queryKey: ["defaultProject"],
		queryFn: async () => {
			const orgsRes = await fetch(`${API_BASE}`, {
				credentials: "include",
			});

			if (!orgsRes.ok) {
				throw new Error("Failed to fetch organizations");
			}

			const { organizations } = await orgsRes.json();

			if (!organizations || organizations.length === 0) {
				throw new Error("No organizations found");
			}

			const defaultOrg = organizations[0];

			const projectsRes = await fetch(`${API_BASE}/${defaultOrg.id}/projects`, {
				credentials: "include",
			});

			if (!projectsRes.ok) {
				throw new Error("Failed to fetch projects");
			}

			const { projects } = await projectsRes.json();

			if (!projects || projects.length === 0) {
				throw new Error("No projects found");
			}

			return projects[0];
		},
	});
}
