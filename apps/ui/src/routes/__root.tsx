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
import { PostHogProvider } from "posthog-js/react";

import appCss from "@/globals.css?url";
import { Toaster } from "@/lib/components/toaster";
import { POSTHOG_HOST, POSTHOG_KEY } from "@/lib/env";
import { cn } from "@/lib/utils";

import type { QueryClient } from "@tanstack/react-query";
import type { PostHogConfig } from "posthog-js";
import type { ReactNode } from "react";

const options: Partial<PostHogConfig> | undefined = {
	api_host: POSTHOG_HOST,
	capture_pageview: "history_change",
	autocapture: true,
};

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	head: () => ({
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				rel: "icon",
				href: "/static/favicon/favicon.ico",
				type: "image/x-icon",
			},
		],
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "title", content: "LLM Gateway" },
			{ property: "og:title", content: "LLM Gateway" },
			{
				property: "og:description",
				content:
					"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface.",
			},
			{ property: "og:image", content: "/static/opengraph.png?v=1" },
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: "https://llmgateway.io" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: "LLM Gateway" },
			{
				name: "twitter:description",
				content:
					"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface.",
			},
			{ name: "twitter:image", content: "/static/opengraph.png?v=1" },
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
					<PostHogProvider apiKey={POSTHOG_KEY} options={options}>
						{children}
					</PostHogProvider>
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
