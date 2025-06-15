import { Link } from "@tanstack/react-router";

import { useUser } from "@/hooks/useUser";

export function AuthLink(props: Omit<React.ComponentProps<typeof Link>, "to">) {
	const { user, isLoading } = useUser();
	return <Link {...props} to={user && !isLoading ? "/dashboard" : "/signup"} />;
}
