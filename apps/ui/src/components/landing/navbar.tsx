import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";

import { Button } from "@/lib/components/button";
import { GITHUB_URL } from "@/lib/env";
import Logo from "@/lib/icons/Logo";

export default function Navbar() {
	return (
		<header className="border-b border-zinc-200 dark:border-zinc-800">
			<div className="container mx-auto px-4 py-4 flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Logo className="h-8 w-8 rounded-full text-black dark:text-white" />
					<span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
						LLM Gateway
					</span>
				</div>

				<nav className="hidden md:flex items-center space-x-8">
					<a
						href="#features"
						className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
					>
						Features
					</a>
					<a
						href="https://llmgateway.io/docs"
						target="_blank"
						className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
					>
						Documentation
					</a>
				</nav>

				<div className="flex items-center space-x-4">
					<a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
						<Button
							variant="outline"
							size="icon"
							className="border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-zinc-500 dark:hover:border-zinc-700"
						>
							<Github className="h-5 w-5" />
							<span className="sr-only">GitHub</span>
						</Button>
					</a>
					<Button
						className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 font-medium"
						asChild
					>
						<Link to="/login">Get Started</Link>
					</Button>
				</div>
			</div>
		</header>
	);
}
