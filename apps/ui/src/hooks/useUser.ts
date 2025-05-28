import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { $api } from "@/lib/fetch-client";

const API_BASE = "/api/user";

export interface UserUpdateData {
	name?: string;
	email?: string;
}

export interface PasswordUpdateData {
	currentPassword: string;
	newPassword: string;
}

export interface UseUserOptions {
	redirectTo?: string;
	redirectWhen?: "authenticated" | "unauthenticated";
}

export function useUser(options?: UseUserOptions) {
	const navigate = useNavigate();

	const { data, isLoading, error } = $api.useQuery("get", "/user/me", {
		retry: 1,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: true,
	});

	useEffect(() => {
		if (isLoading || !options?.redirectTo || !options?.redirectWhen) {
			return;
		}

		const { redirectTo, redirectWhen } = options;
		const hasUser = !!data?.user;

		if (redirectWhen === "authenticated" && hasUser) {
			navigate({ to: redirectTo });
		} else if (redirectWhen === "unauthenticated" && !hasUser) {
			navigate({ to: redirectTo });
		}
	}, [
		data?.user,
		isLoading,
		error,
		navigate,
		options?.redirectTo,
		options?.redirectWhen,
		options,
	]);

	return {
		user: data?.user || null,
		isLoading,
		error,
		data,
	};
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
