import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";

import { useUser } from "@/hooks/useUser";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Label } from "@/lib/components/label";
import { Switch } from "@/lib/components/switch";

export function PricingPlans() {
	const navigate = useNavigate();
	const { user } = useUser();
	const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
		"monthly",
	);

	const handlePlanSelection = (planName: string) => {
		if (planName === "Self-Host") {
			// Open documentation in new tab
			window.open("https://docs.llmgateway.io", "_blank");
			return;
		}

		if (planName === "Enterprise") {
			// Open email client
			window.location.href = "mailto:contact@llmgateway.io";
			return;
		}

		if (!user) {
			// Not authenticated, go to signup with nextUrl
			navigate({
				to: "/signup",
				search: {
					nextUrl: `/pricing?plan=${planName.toLowerCase()}&billing=${billingCycle}`,
				},
			});
		} else {
			// Authenticated, go to pricing page
			window.location.href = `/pricing?plan=${planName.toLowerCase()}&billing=${billingCycle}`;
		}
	};

	const plans = [
		{
			name: "Free",
			description: "Perfect for trying out the platform",
			price: {
				monthly: "$0",
				annual: "$0",
			},
			features: [
				"Access to ALL models",
				"Pay with credits",
				"5% fee on credit usage",
				"Basic analytics",
				"Standard support",
			],
			cta: "Get Started",
			popular: false,
		},
		{
			name: "Pro",
			description: "For professionals and growing teams",
			price: {
				monthly: "$50",
				annual: "$500",
			},
			features: [
				"Access to ALL models",
				"Use your own API keys",
				"NO fees on credit usage",
				"Advanced analytics dashboard",
				"Priority support",
				"Custom provider integration",
			],
			cta: "Upgrade to Pro",
			popular: true,
		},
		{
			name: "Enterprise",
			description: "For large organizations with custom needs",
			price: {
				monthly: "Custom",
				annual: "Custom",
			},
			features: [
				"Everything in Pro",
				"Custom SLAs",
				"Dedicated account manager",
				"Advanced security features",
				"Custom integrations",
				"On-boarding assistance",
				"24/7 premium support",
			],
			cta: "Contact Sales",
			popular: false,
		},
		{
			name: "Self-Host",
			description: "Host on your own infrastructure",
			price: {
				monthly: "Free",
				annual: "Free",
			},
			features: [
				"100% free forever",
				"Full control over your data",
				"Host on your infrastructure",
				"No usage limits",
				"Community support",
				"Regular updates",
			],
			cta: "View Documentation",
			popular: false,
		},
	];

	const discount = 10;

	return (
		<section className="w-full py-12 md:py-24 bg-muted/30" id="pricing">
			<div className="container mx-auto px-4 md:px-6">
				<div className="text-center mb-12">
					<Badge variant="outline" className="mb-4">
						Pricing
					</Badge>
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
						Simple, Transparent Pricing
					</h2>
					<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
						Choose the plan that works best for your needs, with no hidden fees
						or surprises
					</p>

					<div className="flex items-center justify-center mt-8 space-x-4">
						<Label
							htmlFor="billing-toggle"
							className={
								billingCycle === "monthly"
									? "font-medium"
									: "text-muted-foreground"
							}
						>
							Monthly
						</Label>
						<Switch
							id="billing-toggle"
							checked={billingCycle === "annual"}
							onCheckedChange={(checked: boolean) =>
								setBillingCycle(checked ? "annual" : "monthly")
							}
						/>
						<div className="flex items-center">
							<Label
								htmlFor="billing-toggle"
								className={
									billingCycle === "annual"
										? "font-medium"
										: "text-muted-foreground"
								}
							>
								Annual
							</Label>
							<Badge variant="secondary" className="ml-2">
								Save {discount}%
							</Badge>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{plans.map((plan, index) => (
						<Card
							key={index}
							className={`flex flex-col ${plan.popular ? "border-primary shadow-lg relative" : ""}`}
						>
							{plan.popular && (
								<div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
									<Badge className="bg-primary hover:bg-primary">
										Most Popular
									</Badge>
								</div>
							)}
							<CardHeader>
								<CardTitle>{plan.name}</CardTitle>
								<CardDescription>{plan.description}</CardDescription>
								<div className="mt-4">
									<span className="text-3xl font-bold">
										{plan.price[billingCycle]}
									</span>
									{plan.price[billingCycle] !== "Custom" &&
										plan.price[billingCycle] !== "Free" &&
										plan.price[billingCycle] !== "$0" && (
											<span className="text-muted-foreground ml-1">
												/{billingCycle === "monthly" ? "month" : "year"}
											</span>
										)}
								</div>
							</CardHeader>
							<CardContent className="flex-grow">
								<ul className="space-y-2">
									{plan.features.map((feature, i) => (
										<li key={i} className="flex items-center">
											<Check className="h-4 w-4 mr-2 text-green-500" />
											<span className="text-sm">{feature}</span>
										</li>
									))}
								</ul>
							</CardContent>
							<CardFooter>
								<Button
									className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
									variant={plan.popular ? "default" : "outline"}
									onClick={() => handlePlanSelection(plan.name)}
								>
									{plan.cta}
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>

				<div className="mt-12 text-center">
					<p className="text-muted-foreground">
						All plans include access to our API, documentation, and community
						support.
						<br />
						Need a custom solution?{" "}
						<a
							href="mailto:contact@llmgateway.io"
							className="text-primary hover:underline"
						>
							Contact our sales team
						</a>
						.
					</p>
				</div>
			</div>
		</section>
	);
}
