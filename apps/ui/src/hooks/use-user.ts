import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSession } from "../lib/auth-client";

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

	const session = useSession();

	const { data, isPending: isLoading } = session;
	const user = !data ? null : data.user;
	const hasError = !!session.error;

	useEffect(() => {
		if (isLoading) {
			return;
		}

		if (redirect === "authenticated" && user) {
			navigate({ to: redirectTo || "/dashboard" });
		} else if (redirect === "unauthenticated" && (!user || hasError)) {
			navigate({ to: redirectTo || "/login" });
		}
	}, [user, isLoading, hasError, redirect, redirectTo, navigate]);

	return {
		user,
		isLoading,
		isError: hasError,
		...session,
	};
}
