import { Elements } from "@stripe/react-stripe-js";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useDefaultOrganization } from "@/hooks/useOrganization";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/lib/components/dialog";
import { useToast } from "@/lib/components/use-toast";
import { $api } from "@/lib/fetch-client";
import { useStripe } from "@/lib/stripe";

export function PlanManagement() {
	const { data: organization } = useDefaultOrganization();
	const { toast } = useToast();
	const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
	const queryClient = useQueryClient();

	const { data: subscriptionStatus } = $api.useQuery(
		"get",
		"/subscriptions/status",
		{
			retry: 1,
		},
	);

	const cancelSubscriptionMutation = $api.useMutation(
		"post",
		"/subscriptions/cancel-pro-subscription",
	);

	const resumeSubscriptionMutation = $api.useMutation(
		"post",
		"/subscriptions/resume-pro-subscription",
	);

	const handleCancelSubscription = async () => {
		const confirmed = window.confirm(
			"Are you sure you want to cancel your Pro subscription? You'll lose access to provider keys at the end of your billing period.",
		);

		if (!confirmed) {
			return;
		}

		try {
			await cancelSubscriptionMutation.mutateAsync({});
			toast({
				title: "Subscription Canceled",
				description:
					"Your Pro subscription has been canceled. You'll retain access until the end of your billing period.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: `Failed to cancel subscription. Please try again. Error: ${error}`,
				variant: "destructive",
			});
		}
	};

	const handleResumeSubscription = async () => {
		const confirmed = window.confirm(
			"Are you sure you want to resume your Pro subscription? Your subscription will continue and you'll be charged at the next billing cycle.",
		);

		if (!confirmed) {
			return;
		}

		try {
			await resumeSubscriptionMutation.mutateAsync({});
			await queryClient.invalidateQueries({
				queryKey: $api.queryOptions("get", "/subscriptions/status").queryKey,
			});
			toast({
				title: "Subscription Resumed",
				description:
					"Your Pro subscription has been resumed. You'll continue to have access to all Pro features.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: `Failed to resume subscription. Please try again. Error: ${error}`,
				variant: "destructive",
			});
		}
	};

	if (!organization) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Plan & Billing</CardTitle>
					<CardDescription>Loading plan information...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const isProPlan = organization.plan === "pro";
	const planExpiresAt = organization.planExpiresAt
		? new Date(organization.planExpiresAt)
		: null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Plan & Billing</CardTitle>
				<CardDescription>
					Manage your subscription and billing preferences
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-lg font-medium">Current Plan</h3>
							<Badge variant={isProPlan ? "default" : "secondary"}>
								{isProPlan ? "Pro" : "Free"}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground mt-1">
							{isProPlan
								? "Access to provider keys and all features"
								: "Limited to credits-based usage only"}
						</p>
						{planExpiresAt && (
							<p className="text-sm text-muted-foreground mt-1">
								{subscriptionStatus?.cancelAtPeriodEnd
									? `Expires on ${planExpiresAt.toLocaleDateString()}`
									: `Renews on ${planExpiresAt.toLocaleDateString()}`}
							</p>
						)}
					</div>
					<div className="text-right">
						<p className="text-2xl font-bold">
							{isProPlan ? "$50" : "$0"}
							<span className="text-sm font-normal text-muted-foreground">
								/month
							</span>
						</p>
					</div>
				</div>

				<div className="border rounded-lg p-4 space-y-3">
					<h4 className="font-medium">Plan Features</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div
									className={`w-2 h-2 rounded-full ${
										isProPlan ? "bg-green-500" : "bg-gray-300"
									}`}
								/>
								<span>Provider API Keys</span>
								{!isProPlan && (
									<Badge variant="outline" className="text-xs">
										Pro Only
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								<span>Credits System</span>
							</div>
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								<span>API Access</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-green-500" />
								<span>Usage Analytics</span>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between">
				{!isProPlan ? (
					<Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
						<DialogTrigger asChild>
							<Button>Upgrade to Pro</Button>
						</DialogTrigger>
						<DialogContent>
							<UpgradeDialog onSuccess={() => setUpgradeDialogOpen(false)} />
						</DialogContent>
					</Dialog>
				) : (
					<div className="flex gap-2">
						{!subscriptionStatus?.cancelAtPeriodEnd && (
							<Button
								variant="outline"
								onClick={handleCancelSubscription}
								disabled={cancelSubscriptionMutation.isPending}
							>
								{cancelSubscriptionMutation.isPending
									? "Canceling..."
									: "Cancel Subscription"}
							</Button>
						)}
						{subscriptionStatus?.cancelAtPeriodEnd && (
							<div className="flex items-center gap-2">
								<Badge variant="destructive">Subscription Canceled</Badge>
								<Button
									variant="default"
									onClick={handleResumeSubscription}
									disabled={resumeSubscriptionMutation.isPending}
								>
									{resumeSubscriptionMutation.isPending
										? "Resuming..."
										: "Resume Subscription"}
								</Button>
							</div>
						)}
					</div>
				)}
			</CardFooter>
		</Card>
	);
}

function UpgradeDialog({ onSuccess }: { onSuccess: () => void }) {
	const queryClient = useQueryClient();
	const { stripe, isLoading: stripeLoading } = useStripe();
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);

	const createSubscriptionMutation = $api.useMutation(
		"post",
		"/subscriptions/create-pro-subscription",
	);

	const handleUpgrade = async () => {
		if (!stripe) {
			return;
		}

		setLoading(true);

		try {
			const { clientSecret } = await createSubscriptionMutation.mutateAsync({});

			// If no client secret, payment succeeded immediately
			if (!clientSecret) {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions("get", "/subscriptions/status").queryKey,
				});
				toast({
					title: "Upgrade Successful",
					description: "Welcome to Pro! You may need to refresh the page.",
				});
				onSuccess();
				return;
			}

			// Otherwise, confirm the payment
			const result = await stripe.confirmCardPayment(clientSecret);

			if (result.error) {
				toast({
					title: "Payment Failed",
					description: result.error.message,
					variant: "destructive",
					className: "text-white",
				});
			} else {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions("get", "/subscriptions/status").queryKey,
				});
				toast({
					title: "Upgrade Successful",
					description: "Welcome to Pro! You may need to refresh the page.",
				});
				onSuccess();
			}
		} catch (error: any) {
			toast({
				title: "Error",
				description:
					error?.message || "Failed to process upgrade. Please try again.",
				variant: "destructive",
				className: "text-white",
			});
		} finally {
			setLoading(false);
		}
	};

	if (stripeLoading) {
		return (
			<div className="p-6 text-center">
				<p>Loading payment form...</p>
			</div>
		);
	}

	return (
		<Elements stripe={stripe}>
			<DialogHeader>
				<DialogTitle>Upgrade to Pro</DialogTitle>
				<DialogDescription>
					Unlock provider keys and get full access to all features for
					$50/month.
				</DialogDescription>
			</DialogHeader>
			<div className="py-4">
				<div className="border rounded-lg p-4 space-y-3">
					<h4 className="font-medium">What you'll get:</h4>
					<ul className="space-y-2 text-sm">
						<li className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-green-500" />
							Use your own OpenAI, Anthropic, and other provider API keys
						</li>
						<li className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-green-500" />
							Hybrid mode: fallback to credits when needed
						</li>
						<li className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-green-500" />
							No surcharges or fees for API keys or credits usage
						</li>
						<li className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-green-500" />
							All existing features (credits, analytics, etc.)
						</li>
					</ul>
				</div>
			</div>
			<DialogFooter>
				<Button
					onClick={handleUpgrade}
					disabled={loading || createSubscriptionMutation.isPending}
				>
					{loading || createSubscriptionMutation.isPending
						? "Processing..."
						: "Upgrade for $50/month"}
				</Button>
			</DialogFooter>
		</Elements>
	);
}
