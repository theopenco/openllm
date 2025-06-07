import { createFileRoute } from "@tanstack/react-router";

import { AutoTopUpSettings } from "@/components/billing/auto-topup-settings";
import { PlanManagement } from "@/components/billing/plan-management";
import { PaymentMethodsManagement } from "@/components/credits/payment-methods-management";
import { SettingsLoading } from "@/components/settings/settings-loading";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";

export const Route = createFileRoute("/dashboard/_layout/settings/billing")({
	component: RouteComponent,
	pendingComponent: () => <SettingsLoading />,
	errorComponent: ({ error }) => <div>{error.message}</div>,
});

function RouteComponent() {
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
				</div>
			</div>
		</div>
	);
}
