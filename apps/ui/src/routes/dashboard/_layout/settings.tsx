import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SettingsLoading } from "@/components/settings/settings-loading";

export const Route = createFileRoute("/dashboard/_layout/settings")({
	component: RouteComponent,
	pendingComponent: () => <SettingsLoading />,
	errorComponent: ({ error }) => <div>{error.message}</div>,
});

function RouteComponent() {
	return <Outlet />;
}
