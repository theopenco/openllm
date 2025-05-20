import { createFileRoute } from "@tanstack/react-router";

import CodeExample from "@/components/landing/code-example";
import CallToAction from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import Navbar from "@/components/landing/navbar";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<Navbar />
			<main>
				<Hero />
				<Features />
				<CodeExample />
				<CallToAction />
			</main>
			<Footer />
		</div>
	);
}
