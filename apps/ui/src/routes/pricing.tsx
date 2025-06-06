import { createFileRoute } from "@tanstack/react-router";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

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
import { toast } from "@/lib/components/use-toast";
import { $api } from "@/lib/fetch-client";

const searchSchema = z.object({
	plan: z.string().optional(),
	billing: z.enum(["monthly", "annual"]).optional(),
});

export const Route = createFileRoute("/pricing")({
	validateSearch: searchSchema,
	component: PricingPage,
});

function PricingPage() {
	const { user } = useUser({
		redirectTo: "/login",
		redirectWhen: "unauthenticated",
	});
	const { plan: _plan, billing: _billing } = Route.useSearch();
	const [currentPlan, setCurrentPlan] = useState<string>("free");
	const [isLoading, setIsLoading] = useState(false);

	// Fetch current organization plan
	const {
		data: organizationData,
		isLoading: _isLoadingOrg,
		error: _orgError,
	} = $api.useQuery("get", "/orgs");

	useEffect(() => {
		if (
			organizationData?.organizations &&
			organizationData.organizations.length > 0
		) {
			const org = organizationData.organizations[0];
			setCurrentPlan(org.plan || "free");
		}
	}, [organizationData]);

	const createSubscriptionMutation = $api.useMutation(
		"post",
		"/subscriptions/create",
	);

	const handleUpgradeToProAnnual = async () => {
		setIsLoading(true);
		try {
			const response = await createSubscriptionMutation.mutateAsync({
				body: {
					plan: "pro",
					billing: "annual",
				},
			});

			if (response.url) {
				window.location.href = response.url;
			} else {
				throw new Error("No checkout URL received");
			}
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to upgrade plan. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpgradeToProMonthly = async () => {
		setIsLoading(true);
		try {
			const response = await createSubscriptionMutation.mutateAsync({
				body: {
					plan: "pro",
					billing: "monthly",
				},
			});
			if (response.url) {
				window.location.href = response.url;
			} else {
				throw new Error("No checkout URL received");
			}
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error
						? error.message
						: "Failed to upgrade plan. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const plans = [
		{
			id: "free",
			name: "Free",
			description: "Perfect for trying out the platform",
			priceMonthly: 0,
			priceAnnual: 0,
			features: [
				"Access to ALL models",
				"Pay with credits",
				"5% fee on credit usage",
				"Basic analytics",
				"Standard support",
			],
		},
		{
			id: "pro",
			name: "Pro",
			description: "For professionals and growing teams",
			priceMonthly: 50,
			priceAnnual: 500,
			features: [
				"Access to ALL models",
				"Use your own API keys",
				"NO fees on credit usage",
				"Advanced analytics dashboard",
				"Priority support",
				"Custom provider integration",
			],
		},
	];

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold mb-2">Manage Your Subscription</h1>
					<p className="text-muted-foreground">
						Choose the plan that works best for your needs
					</p>
				</div>

				{/* Current Plan */}
				<div className="mb-8">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-green-500" />
								Current Plan
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-lg font-semibold capitalize">
										{currentPlan}
									</h3>
									<p className="text-muted-foreground">
										{currentPlan === "free" && "You're on the free plan"}
										{currentPlan === "pro" && "You're on the pro plan"}
									</p>
								</div>
								<Badge
									variant={currentPlan === "pro" ? "default" : "secondary"}
								>
									{currentPlan === "pro" ? "Pro" : "Free"}
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Available Plans */}
				<div className="grid md:grid-cols-2 gap-6">
					{plans.map((planData) => (
						<Card
							key={planData.id}
							className={`${
								planData.id === "pro" ? "border-primary shadow-lg" : ""
							} ${currentPlan === planData.id ? "opacity-50" : ""}`}
						>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>{planData.name}</CardTitle>
									{planData.id === "pro" && <Badge>Most Popular</Badge>}
								</div>
								<CardDescription>{planData.description}</CardDescription>
								<div className="mt-4">
									<div className="flex items-baseline gap-2">
										<span className="text-3xl font-bold">
											${planData.priceMonthly}
										</span>
										<span className="text-muted-foreground">/month</span>
									</div>
									{planData.priceAnnual > 0 && (
										<div className="text-sm text-muted-foreground">
											or ${planData.priceAnnual}/year (save $100)
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{planData.features.map((feature, i) => (
										<li key={i} className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-500" />
											<span className="text-sm">{feature}</span>
										</li>
									))}
								</ul>
							</CardContent>
							<CardFooter className="flex flex-col gap-2">
								{currentPlan === planData.id ? (
									<Button disabled className="w-full">
										Current Plan
									</Button>
								) : planData.id === "pro" ? (
									<>
										<Button
											onClick={handleUpgradeToProAnnual}
											disabled={isLoading}
											className="w-full"
										>
											{isLoading ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin mr-2" />
													Processing...
												</>
											) : (
												<>
													<CreditCard className="h-4 w-4 mr-2" />
													Upgrade to Pro (Annual)
												</>
											)}
										</Button>
										<Button
											onClick={handleUpgradeToProMonthly}
											disabled={isLoading}
											variant="outline"
											className="w-full"
										>
											{isLoading ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin mr-2" />
													Processing...
												</>
											) : (
												<>
													<CreditCard className="h-4 w-4 mr-2" />
													Upgrade to Pro (Monthly)
												</>
											)}
										</Button>
									</>
								) : (
									<Button disabled variant="outline" className="w-full">
										Current Plan
									</Button>
								)}
							</CardFooter>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
