import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Zap, ArrowRight } from "lucide-react";

import { Button } from "@/lib/components/button";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<div className="flex min-h-screen flex-col justify-center">
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="max-w-[64rem] mx-auto flex h-14 items-center justify-between">
					<div className="flex items-center gap-2 font-semibold">
						<Zap className="h-5 w-5 text-primary" />
						<span>LLMGateway</span>
					</div>
					<div className="flex items-center gap-2">
						<Link to="/login">
							<Button variant="ghost" size="sm">
								Log in
							</Button>
						</Link>
						<Link to="/signup">
							<Button size="sm">Sign up</Button>
						</Link>
					</div>
				</div>
			</header>
			<main className="flex-1 flex items-center justify-center">
				<section className="text-center px-4">
					<div className="flex max-w-[64rem] mx-auto flex-col items-center gap-4">
						<h1 className="text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
							Self-hosted API Gateway for LLMs
						</h1>
						<p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
							An open-source alternative to OpenRouter for self-hosting your own
							LLM API gateway. Route requests to multiple providers, manage API
							keys, and monitor usage.
						</p>
						<div className="flex flex-wrap items-center justify-center gap-4">
							<Link to="/signup">
								<Button size="lg" className="gap-2">
									Get Started <ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
							<Link to="/dashboard">
								<Button variant="outline" size="lg">
									View Demo
								</Button>
							</Link>
						</div>
					</div>
				</section>
			</main>
			<footer className="border-t py-6 md:py-0">
				<div className="max-w-[64rem] mx-auto flex flex-col items-center gap-4 md:h-16 md:flex-row">
					<p className="text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} LLMGateway. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}
