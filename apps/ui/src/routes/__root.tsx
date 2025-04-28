import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Outlet,
	ScriptOnce,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { SessionProvider } from "next-auth/react";

import appCss from "@/globals.css?url";
import { Toaster } from "@/lib/components/toaster";
import { cn } from "@/lib/utils";

import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	head: () => ({
		links: [{ rel: "stylesheet", href: appCss }],
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Roll Your Own Auth - TanStack",
			},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className={cn("bg-background min-h-screen font-sans antialiased")}>
				<ScriptOnce>
					{`document.documentElement.classList.toggle(
            'dark',
            localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
            )`}
				</ScriptOnce>
				<SessionProvider>{children}</SessionProvider>
				<Toaster />
				<TanStackRouterDevtools position="top-right" />
				<ReactQueryDevtools buttonPosition="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
