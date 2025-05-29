import { Outlet, createFileRoute } from "@tanstack/react-router";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { useUser } from "@/hooks/useUser";
import { SidebarProvider } from "@/lib/components/sidebar";

export const Route = createFileRoute("/dashboard/_layout")({
	component: RouteComponent,
});

function RouteComponent() {
	useUser({ redirectTo: "/login", redirectWhen: "unauthenticated" });

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
