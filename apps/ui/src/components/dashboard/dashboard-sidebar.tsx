import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Key,
	LayoutDashboard,
	LogOutIcon,
	Settings,
	Activity,
	KeyRound,
	X,
	ChevronRight,
	ChevronDown,
	BotMessageSquare,
	BrainCircuit,
	FileText,
} from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { useDefaultOrganization } from "@/hooks/useOrganization";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/lib/components/avatar";
import { Button } from "@/lib/components/button";
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
	SidebarMenuSub,
	SidebarMenuSubItem,
	SidebarMenuSubButton,
	SidebarRail,
	useSidebar,
	SidebarTrigger,
} from "@/lib/components/sidebar";
import { DOCS_URL } from "@/lib/env";
import Logo from "@/lib/icons/Logo";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
	const queryClient = useQueryClient();
	const { location } = useRouterState();
	const { toggleSidebar, state: sidebarState, isMobile } = useSidebar();
	const { user } = useUser();
	const { data: organization } = useDefaultOrganization();
	const navigate = useNavigate();
	const posthog = usePostHog();
	const isActive = (path: string) => {
		return location.pathname === path;
	};

	const isSettingsActive = location.pathname.startsWith("/dashboard/settings");

	const [showCreditCTA, setShowCreditCTA] = useState(() => {
		if (typeof window === "undefined") {
			return true;
		}
		return localStorage.getItem("hide-credit-cta") !== "true";
	});

	const [settingsExpanded, setSettingsExpanded] = useState(() => {
		if (typeof window === "undefined") {
			return false;
		}
		return location.pathname.startsWith("/dashboard/settings");
	});

	const hideCreditCTA = () => {
		localStorage.setItem("hide-credit-cta", "true");
		setShowCreditCTA(false);
	};

	const toggleSettingsExpanded = () => {
		setSettingsExpanded(!settingsExpanded);
	};

	const logout = async () => {
		posthog.reset();
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					queryClient.clear();
					navigate({ to: "/login" });
				},
			},
		});
	};

	useEffect(() => {
		if (isSettingsActive && !settingsExpanded) {
			setSettingsExpanded(true);
		}
	}, [location.pathname, isSettingsActive, settingsExpanded]);

	return (
		<>
			{sidebarState === "collapsed" && <SidebarTrigger />}
			<Sidebar variant="floating">
				<SidebarHeader className="border-b">
					<div className="flex h-14 items-center px-4">
						<Link
							to="/dashboard"
							className="inline-flex items-center space-x-2"
						>
							<Logo className="h-8 w-8 rounded-full text-black dark:text-white" />
							<span className="text-xl font-bold tracking-tight">
								LLM Gateway
							</span>
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
									{
										href: "/dashboard/usage",
										label: "Usage & Metrics",
										icon: BarChart3,
									},
									{
										href: "/dashboard/models",
										label: "Models",
										icon: BrainCircuit,
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
											onClick={() => {
												if (isMobile) {
													toggleSidebar();
												}
											}}
										>
											<item.icon className="h-4 w-4" />
											<span>{item.label}</span>
										</Link>
									</SidebarMenuItem>
								))}
								<SidebarMenuItem>
									<div
										className={cn(
											"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
											isSettingsActive
												? "bg-primary/10 text-primary"
												: "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
										)}
										onClick={toggleSettingsExpanded}
									>
										<Settings className="h-4 w-4" />
										<span>Settings</span>
										{settingsExpanded ? (
											<ChevronDown className="ml-auto h-4 w-4" />
										) : (
											<ChevronRight className="ml-auto h-4 w-4" />
										)}
									</div>
									{settingsExpanded && (
										<SidebarMenuSub>
											{[
												{
													href: "/dashboard/settings/preferences",
													label: "Preferences",
												},
												{
													href: "/dashboard/settings/account",
													label: "Account",
												},
												{
													href: "/dashboard/settings/security",
													label: "Security",
												},
												{
													href: "/dashboard/settings/billing",
													label: "Billing",
												},
												{
													href: "/dashboard/settings/transactions",
													label: "Transactions",
												},
												{
													href: "/dashboard/settings/advanced",
													label: "Advanced",
												},
											].map((item) => (
												<SidebarMenuSubItem key={item.href}>
													<SidebarMenuSubButton
														asChild
														isActive={isActive(item.href)}
													>
														<Link
															to={item.href}
															onClick={() => {
																if (isMobile) {
																	toggleSidebar();
																}
															}}
														>
															<span>{item.label}</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									)}
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<SidebarGroup>
						<SidebarGroupLabel className="text-muted-foreground px-2 text-xs font-medium">
							Tools & Resources
						</SidebarGroupLabel>
						<SidebarGroupContent className="mt-2">
							<SidebarMenu>
								<SidebarMenuItem>
									<a
										href="/playground"
										target="_blank"
										rel="noopener noreferrer"
										className={cn(
											"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
											"text-foreground/70 hover:bg-accent hover:text-accent-foreground",
										)}
									>
										<BotMessageSquare className="h-4 w-4" />
										<span>Playground</span>
									</a>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<a
										href={DOCS_URL}
										target="_blank"
										rel="noopener noreferrer"
										className={cn(
											"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
											"text-foreground/70 hover:bg-accent hover:text-accent-foreground",
										)}
									>
										<FileText className="h-4 w-4" />
										<span>Docs</span>
									</a>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="border-t">
					{showCreditCTA && organization && organization.plan !== "pro" && (
						<div className="flex relative flex-col items-start space-y-4 rounded-lg bg-primary/5 p-4 dark:bg-primary/10">
							<button
								aria-label="Dismiss"
								onClick={hideCreditCTA}
								className="absolute right-1.5 top-1.5 rounded-full p-1 text-muted-foreground/70 hover:text-foreground transition"
							>
								<X className="h-3 w-3" />
							</button>
							<div>
								<p className="text-sm font-medium">Upgrade to Pro</p>
								<p className="text-xs text-muted-foreground">
									0% fees on all API calls & more
								</p>
							</div>

							<Button asChild>
								<Link
									to="/dashboard/settings/billing"
									search={{ success: undefined, canceled: undefined }}
								>
									Upgrade
								</Link>
							</Button>
						</div>
					)}

					<div className="flex items-center justify-between p-4 pt-0">
						<div className="flex items-center gap-3">
							<Avatar className="border-border h-9 w-9 border">
								<AvatarImage src="/vibrant-street-market.png" alt="Avatar" />
								<AvatarFallback>
									{user?.name
										? user.name
												.split(" ")
												.slice(0, 2)
												.map((n) => n[0])
												.join("")
												.toUpperCase()
										: user?.email
											? user.email[0].toUpperCase()
											: ""}
								</AvatarFallback>
							</Avatar>
							<div className="text-sm">
								<div className="flex items-center gap-2 font-medium">
									{user?.name}
									<LogOutIcon
										className="cursor-pointer"
										size={14}
										onClick={logout}
									/>
								</div>
								<div className="text-xs text-muted-foreground truncate max-w-[120px]">
									{user?.email}
								</div>
							</div>
						</div>
						<ModeToggle />
					</div>
				</SidebarFooter>

				<SidebarRail />
			</Sidebar>
		</>
	);
}
