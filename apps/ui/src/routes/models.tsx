import { createFileRoute } from "@tanstack/react-router";

import Footer from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { ModelsSupported } from "@/components/models-supported";

function ProvidersPage() {
	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<Hero navbarOnly />
				<ModelsSupported />
			</main>
			<Footer />
		</div>
	);
}

export const Route = createFileRoute("/models")({
	component: ProvidersPage,
});
