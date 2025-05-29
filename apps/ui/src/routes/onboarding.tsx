import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	const navigate = useNavigate();
	const session = useSession();

	useEffect(() => {
		if (!session.isPending && !session.data?.user) {
			navigate({ to: "/login" });
		}
	}, [session.data, session.isPending, navigate]);

	return (
		<div className="bg-background min-h-screen">
			<div className="flex min-h-screen flex-col">
				<header className="border-b">
					<div className="container mx-auto flex h-16 items-center px-4">
						<div className="flex items-center gap-2">
							<span className="text-xl font-bold">LLM Gateway</span>
						</div>
					</div>
				</header>
				<main className="flex-1">
					<OnboardingWizard />
				</main>
			</div>
		</div>
	);
}
