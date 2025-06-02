import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { useDefaultOrganization } from "@/hooks/useOrganization";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { toast } from "@/lib/components/use-toast";
import { $api } from "@/lib/fetch-client";

export function AutoTopUpSettings() {
	const { data: currentOrganization, isLoading } = useDefaultOrganization();
	const [enabled, setEnabled] = useState(false);
	const [threshold, setThreshold] = useState("10.00");
	const [amount, setAmount] = useState("10.00");

	const queryClient = useQueryClient();
	const queryKey = $api.queryOptions("get", "/orgs").queryKey;

	const updateMutation = $api.useMutation("patch", "/orgs/{id}");

	useEffect(() => {
		if (currentOrganization) {
			setEnabled(currentOrganization.autoTopUpEnabled || false);
			setThreshold(currentOrganization.autoTopUpThreshold || "10.00");
			setAmount(currentOrganization.autoTopUpAmount || "10.00");
		}
	}, [currentOrganization]);

	const handleSave = () => {
		if (!currentOrganization?.id) {
			return;
		}

		const thresholdNum = parseFloat(threshold);
		const amountNum = parseFloat(amount);

		if (thresholdNum < 5) {
			toast({
				title: "Invalid threshold",
				description: "Threshold must be at least $5.00",
				variant: "destructive",
			});
			return;
		}

		if (amountNum < 10) {
			toast({
				title: "Invalid amount",
				description: "Top-up amount must be at least $10.00",
				variant: "destructive",
			});
			return;
		}

		updateMutation.mutate(
			{
				params: { path: { id: currentOrganization.id } },
				body: {
					autoTopUpEnabled: enabled,
					autoTopUpThreshold: threshold,
					autoTopUpAmount: amount,
				},
			},
			{
				onSuccess: () => {
					toast({
						title: "Success",
						description: "Auto top-up settings updated",
					});
					queryClient.invalidateQueries({ queryKey });
				},
				onError: (error: any) => {
					toast({
						title: "Error",
						description: error?.message ?? "Failed to update settings",
						variant: "destructive",
					});
				},
			},
		);
	};

	if (isLoading) {
		return <div>Loading auto top-up settings...</div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor="auto-topup-enabled">Enable Auto Top-up</Label>
					<p className="text-sm text-muted-foreground">
						Automatically add credits when balance falls below threshold
					</p>
				</div>
				<input
					id="auto-topup-enabled"
					type="checkbox"
					checked={enabled}
					onChange={(e) => setEnabled(e.target.checked)}
					className="h-4 w-4"
				/>
			</div>

			{enabled && (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="threshold">Threshold ($)</Label>
							<Input
								id="threshold"
								type="number"
								min="5"
								step="0.01"
								value={threshold}
								onChange={(e) => setThreshold(e.target.value)}
								placeholder="10.00"
							/>
							<p className="text-xs text-muted-foreground">Minimum: $5.00</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="amount">Top-up Amount ($)</Label>
							<Input
								id="amount"
								type="number"
								min="10"
								step="0.01"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="10.00"
							/>
							<p className="text-xs text-muted-foreground">Minimum: $10.00</p>
						</div>
					</div>
				</div>
			)}

			<Button onClick={handleSave} disabled={updateMutation.isPending}>
				{updateMutation.isPending ? "Saving..." : "Save Settings"}
			</Button>
		</div>
	);
}
