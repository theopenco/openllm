import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

import { $api } from "@/lib/fetch-client";

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
	const posthog = usePostHog();
	const navigate = useNavigate();

	const { data, isLoading, error } = $api.useQuery("get", "/user/me", {
		retry: 0,
		gcTime: 0,
	});

	if (data) {
		posthog.identify(data.user.id, {
			email: data.user.email,
			name: data.user.name,
		});
	}

	useEffect(() => {
		if (!options?.redirectTo || !options?.redirectWhen) {
			return;
		}

		const { redirectTo, redirectWhen } = options;
		const hasUser = !!data?.user;

		if (redirectWhen === "authenticated" && hasUser) {
			navigate({ to: redirectTo });
		} else if (
			redirectWhen === "unauthenticated" &&
			!isLoading &&
			!hasUser &&
			!error
		) {
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
	return $api.useMutation("patch", "/user/me", {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user"] });
			queryClient.invalidateQueries({ queryKey: ["session"] });
		},
	});
}

export function useUpdatePassword() {
	return $api.useMutation("put", "/user/password");
}

export function useDeleteAccount() {
	return $api.useMutation("delete", "/user/me");
}
