import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { SettingsLoading } from "@/components/settings/settings-loading";
import { useDefaultOrganization } from "@/hooks/useOrganization";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { $api } from "@/lib/fetch-client";

export const Route = createFileRoute("/dashboard/_layout/settings/invoices")({
	component: InvoicesPage,
	pendingComponent: SettingsLoading,
	errorComponent: () => <div>Error loading invoices</div>,
});

function InvoicesPage() {
	const { data: organization } = useDefaultOrganization();

	const { data } = $api.useSuspenseQuery("get", "/orgs/{id}/transactions", {
		params: {
			path: { id: organization?.id ?? "" },
		},
	});

	if (!organization || !data) {
		return null;
	}

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Transaction History</CardTitle>
						<CardDescription>
							View your organization's transaction history, including credit
							top-ups and subscription events.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
											Date
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
											Type
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
											Credits
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
											Total Paid
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
											Status
										</th>
										<th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
											Description
										</th>
									</tr>
								</thead>
								<tbody>
									{data.transactions.map((transaction) => (
										<tr key={transaction.id} className="border-b">
											<td className="p-4 align-middle">
												{format(
													new Date(transaction.createdAt),
													"MMM d, yyyy HH:mm",
												)}
											</td>
											<td className="p-4 align-middle">
												{transaction.type === "credit_topup" && "Credit Top-up"}
												{transaction.type === "subscription_start" &&
													"Subscription Start"}
												{transaction.type === "subscription_cancel" &&
													"Subscription Cancelled"}
												{transaction.type === "subscription_end" &&
													"Subscription Ended"}
											</td>
											<td className="p-4 align-middle">
												{transaction.creditAmount || "—"}
											</td>
											<td className="p-4 align-middle">
												{transaction.amount || "—"}
											</td>
											<td className="p-4 align-middle">
												<span
													className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														transaction.status === "completed"
															? "bg-green-50 text-green-700"
															: transaction.status === "pending"
																? "bg-yellow-50 text-yellow-700"
																: "bg-red-50 text-red-700"
													}`}
												>
													{transaction.status}
												</span>
											</td>
											<td className="p-4 align-middle text-sm text-muted-foreground">
												{transaction.description || "-"}
											</td>
										</tr>
									))}
									{data.transactions.length === 0 && (
										<tr>
											<td
												colSpan={6}
												className="p-4 text-center text-muted-foreground"
											>
												No transactions found
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
