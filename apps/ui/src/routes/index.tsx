import { createFileRoute } from "@tanstack/react-router";

import CodeExample from "@/components/landing/code-example";
import CallToAction from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import { Graph } from "@/components/landing/graph";
import { Hero } from "@/components/landing/hero";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<Hero />
				<Features />
				<Graph />
				<CodeExample />
				<CallToAction />
			</main>
			<Footer />
		</div>
	);
}
