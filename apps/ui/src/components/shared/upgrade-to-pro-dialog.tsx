import { Elements } from "@stripe/react-stripe-js";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/lib/components/button";
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

interface UpgradeToProDialogProps {
	children: React.ReactNode;
	onSuccess?: () => void;
}

export function UpgradeToProDialog({
	children,
	onSuccess,
}: UpgradeToProDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<UpgradeDialogContent
					onSuccess={() => {
						setOpen(false);
						onSuccess?.();
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

function UpgradeDialogContent({ onSuccess }: { onSuccess: () => void }) {
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
				// wait for webhook
				await new Promise((resolve) => {
					setTimeout(resolve, 3000);
				});

				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions("get", "/subscriptions/status").queryKey,
				});

				toast({
					title: "Upgrade Successful",
					description:
						"Welcome to Pro! You may need to wait for a minute and/or refresh the page.",
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
				return;
			}
			const status = result.paymentIntent?.status;

			if (status === "succeeded") {
				await queryClient.invalidateQueries({
					queryKey: $api.queryOptions("get", "/subscriptions/status").queryKey,
				});
				toast({
					title: "Upgrade Successful",
					description:
						"Welcome to Pro! You may need to wait for a minute and/or refresh the page.",
				});
				onSuccess();
			} else if (status === "requires_action") {
				toast({
					title: "Additional Authentication Required",
					description: "Please complete the additional authentication steps.",
				});
			} else if (status === "processing") {
				toast({
					title: "Payment Processing",
					description:
						"Your payment is being processed. Please check later for completion.",
				});
			} else if (status === "requires_capture") {
				toast({
					title: "Payment Authorized",
					description:
						"Your payment has been authorized and will be captured soon.",
				});
			} else {
				toast({
					title: `Payment Status: ${status}`,
					description:
						"Unable to determine payment status. Please contact support.",
					variant: "destructive",
					className: "text-white",
				});
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
				<div className="flex flex-col gap-2 items-end">
					<Button
						onClick={handleUpgrade}
						disabled={loading || createSubscriptionMutation.isPending}
					>
						{loading || createSubscriptionMutation.isPending
							? "Processing..."
							: "Upgrade for $50/month now"}
					</Button>
					<div className="text-sm text-muted-foreground">
						<p>We will charge your card now.</p>
					</div>
				</div>
			</DialogFooter>
		</Elements>
	);
}
