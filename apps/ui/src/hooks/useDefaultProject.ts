import { useSuspenseQuery } from "@tanstack/react-query";

export interface Project {
	id: string;
	name: string;
	cachingEnabled: boolean;
	cacheDurationSeconds: number;
	organizationId: string;
}

const mockDefaultProject: Project = {
	id: "default-project",
	name: "Default Project",
	cachingEnabled: false,
	cacheDurationSeconds: 60,
	organizationId: "default-org",
};

export function useDefaultProject() {
	return useSuspenseQuery({
		queryKey: ["defaultProject"],
		queryFn: async () => {
			return mockDefaultProject;
		},
	});
}
