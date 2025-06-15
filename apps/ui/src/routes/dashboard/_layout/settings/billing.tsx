import {
	createFileRoute,
	Link,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { AutoTopUpSettings } from "@/components/billing/auto-topup-settings";
import { PlanManagement } from "@/components/billing/plan-management";
import { PaymentMethodsManagement } from "@/components/credits/payment-methods-management";
import { SettingsLoading } from "@/components/settings/settings-loading";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { useToast } from "@/lib/components/use-toast";

export const Route = createFileRoute("/dashboard/_layout/settings/billing")({
	component: RouteComponent,
	pendingComponent: () => <SettingsLoading />,
	errorComponent: ({ error }) => <div>{error.message}</div>,
	validateSearch: (search: Record<string, unknown>) => ({
		success: search.success === "true" || search.success === true || undefined,
		canceled:
			search.canceled === "true" || search.canceled === true || undefined,
	}),
});

function RouteComponent() {
	const search = useSearch({ from: "/dashboard/_layout/settings/billing" });
	const { toast } = useToast();
	const navigate = useNavigate();

	useEffect(() => {
		if (search.success) {
			toast({
				title: "Subscription successful!",
				description: "Welcome to Pro! Your subscription is now active.",
			});
			navigate({
				to: "/dashboard/settings/billing",
				search: { success: undefined, canceled: undefined },
				replace: true,
			});
		} else if (search.canceled) {
			toast({
				title: "Subscription canceled",
				description: "You can try again anytime.",
				variant: "destructive",
			});
			// Clear the URL parameters
			navigate({
				to: "/dashboard/settings/billing",
				search: { success: undefined, canceled: undefined },
				replace: true,
			});
		}
	}, [search.success, search.canceled, toast, navigate]);

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Billing</h2>
				</div>
				<div className="space-y-4">
					<PlanManagement />
					<AutoTopUpSettings />
					<Card>
						<CardHeader>
							<CardTitle>Payment Methods</CardTitle>
							<CardDescription>
								Manage your saved payment methods for credits and subscriptions
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<PaymentMethodsManagement />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Transactions</CardTitle>
							<CardDescription>
								View your payment history and download invoices
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-lg font-medium">Transactions</h3>
										<p className="text-sm text-muted-foreground">
											View your billing history and download invoices
										</p>
										3
									</div>
									<Button asChild>
										<Link to="/dashboard/settings/transactions">
											Transaction History
										</Link>
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
