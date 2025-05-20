import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";

const API_BASE = "/api/keys/provider";

export interface ProviderKey {
	id: string;
	createdAt: string;
	updatedAt: string;
	provider: string;
	baseUrl?: string;
	status: string;
	projectId: string;
	maskedToken: string;
}

export function useProviderKeys() {
	return useSuspenseQuery({
		queryKey: ["providerKeys"],
		queryFn: async () => {
			const res = await fetch(API_BASE, {
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to fetch provider keys: ${errorText}`);
			}

			const data: { providerKeys: ProviderKey[] } = await res.json();
			return data;
		},
	});
}

export function useCreateProviderKey() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			provider,
			token,
			baseUrl,
		}: {
			provider: string;
			token: string;
			baseUrl?: string;
		}) => {
			const res = await fetch(API_BASE, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider, token, baseUrl }),
				credentials: "include",
			});
			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to add provider key: ${errorText}`);
			}
			return await res.json();
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["providerKeys"] }),
	});
}

export function useDeleteProviderKey() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`${API_BASE}/${id}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to delete provider key: ${errorText}`);
			}
			return await res.json();
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["providerKeys"] }),
	});
}

export function useToggleProviderKeyStatus() {
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
				throw new Error(`Failed to update provider key status: ${errorText}`);
			}
			return await res.json();
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["providerKeys"] }),
	});
}
