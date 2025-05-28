import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { $api } from "@/lib/fetch-client";

interface UseUserOptions {
	/**
	 * Whether to redirect the user based on authentication state
	 * - "authenticated": Redirect to dashboard if user is authenticated
	 * - "unauthenticated": Redirect to login if user is not authenticated
	 * - false: No redirection (default)
	 */
	redirect?: "authenticated" | "unauthenticated" | false;

	/**
	 * Custom redirect path (defaults to "/dashboard" for authenticated and "/login" for unauthenticated)
	 */
	redirectTo?: string;
}

/**
 * Hook to get the current user and handle authentication redirects
 */
export function useUser(options: UseUserOptions = {}) {
	const { redirect = false, redirectTo } = options;
	const navigate = useNavigate();

	const { data, isLoading, isError, error } = $api.useQuery("get", "/user/me", {
		retry: false, // Don't retry on auth failures
	});

	const user = data?.user || null;

	useEffect(() => {
		if (isLoading) {
			return;
		}

		if (redirect === "authenticated" && user) {
			navigate({ to: redirectTo || "/dashboard" });
		} else if (redirect === "unauthenticated" && (!user || isError)) {
			navigate({ to: redirectTo || "/login" });
		}
	}, [user, isLoading, isError, redirect, redirectTo, navigate]);

	return {
		user,
		isLoading,
		isError,
		error,
	};
}
