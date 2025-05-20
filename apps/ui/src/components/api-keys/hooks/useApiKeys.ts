import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";

const API_BASE = "/api/keys/api";

export interface ApiKey {
	id: string;
	createdAt: string;
	updatedAt: string;
	description: string;
	status: string;
	projectId: string;
	maskedToken: string;
}

export function useApiKeys() {
	return useSuspenseQuery({
		queryKey: ["apiKeys"],
		queryFn: async () => {
			const res = await fetch(API_BASE, {
				credentials: "include",
			});

			if (!res.ok) {
				throw new Error("Failed to fetch API keys");
			}

			const data: { apiKeys: ApiKey[] } = await res.json();
			return data;
		},
	});
}

export function useCreateApiKey() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (description: string) => {
			const res = await fetch(API_BASE, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ description }),
				credentials: "include",
			});
			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to create API key: ${errorText}`);
			}
			return await res.json();
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apiKeys"] }),
	});
}

export function useDeleteApiKey() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`${API_BASE}/${id}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to delete API key: ${errorText}`);
			}
			return await res.json();
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apiKeys"] }),
	});
}

export function useToggleApiKeyStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			status,
		}: {
			id: string;
			status: "active" | "inactive";
		}) => {
			const res = await fetch(`${API_BASE}/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status }),
				credentials: "include",
			});
			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to update API key status: ${errorText}`);
			}
			return await res.json();
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apiKeys"] }),
	});
}
