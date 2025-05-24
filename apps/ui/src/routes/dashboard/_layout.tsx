import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { useSession } from "@/lib/auth-client";
import { SidebarProvider } from "@/lib/components/sidebar";

export const Route = createFileRoute("/dashboard/_layout")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const session = useSession();

	useEffect(() => {
		if (!session.isPending && !session.data?.user) {
			navigate({ to: "/login" });
		}
	}, [session.data, session.isPending, navigate]);

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
