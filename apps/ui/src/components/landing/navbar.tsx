import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";

import { Button } from "@/lib/components/button";

export default function Navbar() {
	return (
		<header className="border-b border-zinc-800">
			<div className="container mx-auto px-4 py-4 flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<div className="h-8 w-8 rounded-full bg-white" />
					<span className="text-xl font-bold tracking-tight">OpenLLM</span>
				</div>

				<nav className="hidden md:flex items-center space-x-8">
					<a
						href="#features"
						className="text-sm text-zinc-400 hover:text-white transition-colors"
					>
						Features
					</a>
					<a
						href="#docs-link"
						target="_blank"
						className="text-sm text-zinc-400 hover:text-white transition-colors"
					>
						Documentation
					</a>
				</nav>

				<div className="flex items-center space-x-4">
					<a
						href="https://github.com/theopenco/openllm"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button
							variant="outline"
							size="icon"
							className="border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
						>
							<Github className="h-5 w-5" />
							<span className="sr-only">GitHub</span>
						</Button>
					</a>
					<Button
						className="bg-white text-black hover:bg-zinc-200 font-medium"
						asChild
					>
						<Link to="/login">Get Started</Link>
					</Button>
				</div>
			</div>
		</header>
	);
}
