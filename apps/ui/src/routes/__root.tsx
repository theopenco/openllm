import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	ScriptOnce,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";

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
				title: "LLM Gateway",
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
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					storageKey="theme"
				>
					{children}
				</ThemeProvider>
				<Toaster />
				{process.env.NODE_ENV === "development" && (
					<>
						<TanStackRouterDevtools position="top-right" />
						<ReactQueryDevtools buttonPosition="bottom-right" />
					</>
				)}
				<Scripts />
			</body>
		</html>
	);
}
