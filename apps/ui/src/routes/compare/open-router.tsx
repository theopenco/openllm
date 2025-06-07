import { createFileRoute } from "@tanstack/react-router";

import { HeroCompare } from "@/components/compare/hero-compare";
import { Comparison } from "@/components/landing/comparison";
import Footer from "@/components/landing/footer";

export const Route = createFileRoute("/compare/open-router")({
	component: RouteComponent,
	head: () => ({
		meta: [
			{
				title: "LLM Gateway vs OpenRouter - Feature Comparison | LLM Gateway",
			},
			{
				name: "description",
				content:
					"Compare LLM Gateway's advanced routing, analytics, and cost optimization features against OpenRouter's basic proxy service. See why developers choose our unified API gateway for production LLM applications.",
			},
			{
				property: "og:title",
				content: "LLM Gateway vs OpenRouter - Feature Comparison",
			},
			{
				property: "og:description",
				content:
					"Compare LLM Gateway's advanced routing, analytics, and cost optimization features against OpenRouter's basic proxy service. See why developers choose our unified API gateway for production LLM applications.",
			},
			{
				name: "twitter:title",
				content: "LLM Gateway vs OpenRouter - Feature Comparison",
			},
			{
				name: "twitter:description",
				content:
					"Compare LLM Gateway's advanced routing, analytics, and cost optimization features against OpenRouter's basic proxy service.",
			},
		],
	}),
});

function RouteComponent() {
	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<HeroCompare />
				<Comparison />
			</main>
			<Footer />
		</div>
	);
}
