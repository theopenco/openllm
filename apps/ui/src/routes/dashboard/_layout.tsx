import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { SidebarProvider } from "@/lib/components/sidebar";
import { $api } from "@/lib/fetch-client";

export const Route = createFileRoute("/dashboard/_layout")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { data, isLoading } = $api.useSuspenseQuery("get", "/user/me");

	useEffect(() => {
		if (!isLoading && !data?.user) {
			navigate({ to: "/login" });
		}
	}, [data?.user, isLoading, navigate]);

	return (
		<SidebarProvider>
			<div className="flex min-h-screen w-full flex-col">
				<MobileHeader />
				<div className="flex flex-1">
					<DashboardSidebar />
					<main className="bg-background w-full flex-1 overflow-y-auto">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
