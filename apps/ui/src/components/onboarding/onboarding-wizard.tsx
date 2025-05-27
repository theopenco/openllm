import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useState } from "react";

import { ApiKeyStep } from "./api-key-step";
import { CreditsStep } from "./credits-step";
import { ProviderKeyStep } from "./provider-key-step";
import { WelcomeStep } from "./welcome-step";
import { Card, CardContent } from "@/lib/components/card";
import { Stepper } from "@/lib/components/stepper";

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

const STEPS = [
	{
		id: "welcome",
		title: "Welcome",
		component: WelcomeStep,
	},
	{
		id: "api-key",
		title: "API Key",
		component: ApiKeyStep,
	},
	{
		id: "provider-key",
		title: "Provider Key",
		component: ProviderKeyStep,
		optional: true,
	},
	{
		id: "credits",
		title: "Credits",
		component: CreditsStep,
		optional: true,
	},
];

export function OnboardingWizard() {
	const [activeStep, setActiveStep] = useState(0);
	const navigate = useNavigate();

	const handleStepChange = (step: number) => {
		if (step >= STEPS.length) {
			navigate({ to: "/dashboard" });
			return;
		}
		setActiveStep(step);
	};

	const CurrentStepComponent = STEPS[activeStep].component;

	return (
		<div className="container mx-auto max-w-3xl py-10">
			<Card>
				<CardContent className="p-6 sm:p-8">
					<Stepper
						steps={STEPS.map(({ id, title, optional }) => ({
							id,
							title,
							optional,
						}))}
						activeStep={activeStep}
						onStepChange={handleStepChange}
						className="mb-6"
					>
						{activeStep === 3 ? (
							<Elements stripe={stripePromise}>
								<CurrentStepComponent />
							</Elements>
						) : (
							<CurrentStepComponent />
						)}
					</Stepper>
				</CardContent>
			</Card>
		</div>
	);
}
