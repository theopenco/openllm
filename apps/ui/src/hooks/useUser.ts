import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/content/user";

export interface UserUpdateData {
	name?: string;
	email?: string;
}

export interface PasswordUpdateData {
	currentPassword: string;
	newPassword: string;
}

export function useUpdateUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: UserUpdateData) => {
			const res = await fetch(`${API_BASE}/me`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to update user: ${errorText}`);
			}

			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user"] });
			queryClient.invalidateQueries({ queryKey: ["session"] });
		},
	});
}

export function useUpdatePassword() {
	return useMutation({
		mutationFn: async (data: PasswordUpdateData) => {
			const res = await fetch(`${API_BASE}/password`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to update password: ${errorText}`);
			}

			return await res.json();
		},
	});
}

export function useDeleteAccount() {
	return useMutation({
		mutationFn: async () => {
			const res = await fetch(`${API_BASE}/me`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(`Failed to delete account: ${errorText}`);
			}

			return await res.json();
		},
	});
}
