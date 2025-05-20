import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";

import heroImageLight from "@/assets/hero-light.png";
import heroImageDark from "@/assets/hero.png";
import { Button } from "@/lib/components/button";

export default function Hero() {
	const { theme } = useTheme();
	const imageSrc = theme === "light" ? heroImageLight : heroImageDark;

	return (
		<section className="py-20 md:py-32 border-b border-zinc-200 dark:border-zinc-800">
			<div className="container mx-auto px-4 text-center">
				<h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto text-zinc-900 dark:text-white">
					One API Gateway for All Your LLM Needs
				</h1>
				<p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
					Route, manage, and analyze your LLM requests across multiple providers
					with a unified API interface.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Button
						className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 px-8 py-6 text-base font-medium"
						asChild
					>
						<Link to="/login">Get Started</Link>
					</Button>
					<Button
						variant="outline"
						className="border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white hover:text-black dark:hover:text-white hover:border-zinc-500 dark:hover:border-zinc-700 px-8 py-6 text-base"
						asChild
					>
						<a href="#docs-link" target="_blank">
							View Documentation
							<ArrowRight className="ml-2 h-4 w-4" />
						</a>
					</Button>
				</div>

				<div className="mt-16 relative">
					<div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-black z-10" />
					<div className="h-[400px] w-full max-w-4xl mx-auto border border-zinc-300 dark:border-zinc-800 rounded-lg overflow-hidden relative">
						<img
							src={imageSrc}
							alt="OpenLLM Dashboard"
							className="w-full h-full object-cover"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
