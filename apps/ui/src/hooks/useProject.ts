import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/content/projects";

export interface ProjectSettings {
	cachingEnabled?: boolean;
	cacheDurationSeconds?: number;
}

export function useUpdateProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			settings,
		}: {
			id: string;
			settings: ProjectSettings;
		}) => {
			const res = await fetch(`${API_BASE}/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(settings),
				credentials: "include",
			});
			if (!res.ok) {
				throw new Error("Failed to update project settings");
			}
			return await res.json();
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
	});
}
