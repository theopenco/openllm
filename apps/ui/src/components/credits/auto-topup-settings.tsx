import { useState, useEffect } from "react";

import { useDefaultOrganization } from "@/hooks/useOrganization";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { toast } from "@/lib/components/use-toast";

export function AutoTopUpSettings() {
	const { data: currentOrganization } = useDefaultOrganization();
	const [enabled, setEnabled] = useState(false);
	const [threshold, setThreshold] = useState("10.00");
	const [amount, setAmount] = useState("10.00");
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchSettings = async () => {
			if (!currentOrganization?.id) {
				return;
			}

			setIsLoading(true);
			try {
				const response = await fetch(
					`/api/orgs/${currentOrganization.id}/auto-topup`,
					{
						credentials: "include",
					},
				);

				if (response.ok) {
					const data = await response.json();
					setEnabled(data.autoTopUpEnabled || false);
					setThreshold(data.autoTopUpThreshold || "10.00");
					setAmount(data.autoTopUpAmount || "10.00");
				}
			} catch (error) {
				console.error("Failed to fetch auto top-up settings:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSettings();
	}, [currentOrganization?.id]);

	const handleSave = async () => {
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

		setIsSaving(true);
		try {
			const response = await fetch(
				`/api/orgs/${currentOrganization.id}/auto-topup`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({
						autoTopUpEnabled: enabled,
						autoTopUpThreshold: threshold,
						autoTopUpAmount: amount,
					}),
				},
			);

			if (response.ok) {
				toast({
					title: "Success",
					description: "Auto top-up settings updated",
				});
			} else {
				throw new Error("Failed to update settings");
			}
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
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

			<Button onClick={handleSave} disabled={isSaving}>
				{isSaving ? "Saving..." : "Save Settings"}
			</Button>
		</div>
	);
}
