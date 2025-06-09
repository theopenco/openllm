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
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);

	const createSubscriptionMutation = $api.useMutation(
		"post",
		"/subscriptions/create-pro-subscription",
	);

	const handleUpgrade = async () => {
		setLoading(true);

		try {
			const { checkoutUrl } = await createSubscriptionMutation.mutateAsync({});

			// Redirect to Stripe Checkout
			window.location.href = checkoutUrl;
		} catch (error) {
			toast({
				title: "Upgrade Failed",
				description: `Failed to create checkout session. Please try again. Error: ${error}`,
				variant: "destructive",
			});
			setLoading(false);
		}
	};

	return (
		<>
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
							? "Redirecting to checkout..."
							: "Upgrade for $50/month now"}
					</Button>
					<div className="text-sm text-muted-foreground">
						<p>You'll be redirected to Stripe Checkout to complete payment.</p>
					</div>
				</div>
			</DialogFooter>
		</>
	);
}
