import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	CreditCard,
	Key,
	LayoutDashboard,
	LogOutIcon,
	Settings,
	Zap,
	Activity,
	KeyRound,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { signOut, useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/lib/components/avatar";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	SidebarRail,
} from "@/lib/components/sidebar";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
	const { location } = useRouterState();
	const session = useSession();
	const user = session.data?.user;
	const navigate = useNavigate();

	const isActive = (path: string) => {
		return location.pathname === path;
	};

	return (
		<Sidebar variant="floating">
			<SidebarHeader className="border-b">
				<div className="flex h-14 items-center px-4">
					<Link
						to="/dashboard"
						className="flex items-center gap-2 font-semibold"
					>
						<Zap className="text-primary h-5 w-5" />
						<span className="text-lg">OpenLLM</span>
					</Link>
				</div>
			</SidebarHeader>

			<SidebarContent className="px-2 py-4">
				<SidebarGroup>
					<SidebarGroupLabel className="text-muted-foreground px-2 text-xs font-medium">
						Navigation
					</SidebarGroupLabel>
					<SidebarGroupContent className="mt-2">
						<SidebarMenu>
							{[
								{
									href: "/dashboard",
									label: "Dashboard",
									icon: LayoutDashboard,
								},
								{ href: "/dashboard/api-keys", label: "API Keys", icon: Key },
								{
									href: "/dashboard/provider-keys",
									label: "Provider Keys",
									icon: KeyRound,
								},
								{
									href: "/dashboard/activity",
									label: "Activity",
									icon: Activity,
								},
								// {
								// 	href: "/dashboard/usage",
								// 	label: "Usage & Metrics",
								// 	icon: BarChart3,
								// },
								{
									href: "/dashboard/models",
									label: "Models & Providers",
									icon: CreditCard,
								},
								{
									href: "/dashboard/settings",
									label: "Settings",
									icon: Settings,
								},
							].map((item) => (
								<SidebarMenuItem key={item.href}>
									<Link
										to={item.href}
										className={cn(
											"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
											isActive(item.href)
												? "bg-primary/10 text-primary"
												: "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
										)}
									>
										<item.icon className="h-4 w-4" />
										<span>{item.label}</span>
									</Link>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t">
				<div className="flex items-center justify-between p-4">
					<div className="flex items-center gap-3">
						<Avatar className="border-border h-9 w-9 border">
							<AvatarImage src="/vibrant-street-market.png" alt="Avatar" />
							<AvatarFallback>AU</AvatarFallback>
						</Avatar>
						<div className="text-sm">
							<div className="font-medium flex items-center gap-2">
								{user?.name}
								<LogOutIcon
									className="cursor-pointer"
									size={14}
									onClick={async () => {
										await signOut();
										void navigate({ to: "/login" });
									}}
								/>
							</div>
							<div className="text-muted-foreground text-xs">{user?.email}</div>
						</div>
					</div>
					<ModeToggle />
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
