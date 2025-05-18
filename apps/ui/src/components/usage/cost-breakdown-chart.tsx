import { providers } from "@openllm/models";
import { useState } from "react";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

import { useActivity } from "@/hooks/useActivity";
import { Button } from "@/lib/components/button";

export function CostBreakdownChart() {
	const [days, setDays] = useState<7 | 30>(7);
	const { data, isLoading, error } = useActivity(days);

	if (isLoading) {
		return (
			<div className="flex h-[350px] items-center justify-center">
				Loading cost data...
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-[350px] items-center justify-center">
				<p className="text-destructive">Error loading activity data</p>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="flex h-[350px] items-center justify-center">
				<p className="text-muted-foreground">No cost data available</p>
			</div>
		);
	}

	const providerCosts = new Map<string, number>();

	data.forEach((day) => {
		day.modelBreakdown.forEach((model) => {
			const currentCost = providerCosts.get(model.provider) || 0;
			providerCosts.set(model.provider, currentCost + model.cost);
		});
	});

	const chartData = Array.from(providerCosts.entries())
		.map(([provider, cost]) => ({
			name: provider,
			value: cost,
			color: getProviderColor(provider),
		}))
		.sort((a, b) => b.value - a.value);

	function getProviderColor(providerName: string) {
		// Find the provider in the providers array by name (case-insensitive)
		const provider = providers.find(
			(p) => p.name.toLowerCase() === providerName.toLowerCase(),
		);

		// Return the color if found, otherwise use a default color
		return provider?.color || "#94a3b8"; // Default color for unknown providers
	}

	const totalCost = chartData.reduce((sum, item) => sum + item.value, 0);

	return (
		<div>
			<div className="flex items-center justify-end space-x-2 mb-4">
				<Button
					variant={days === 7 ? "default" : "outline"}
					size="sm"
					onClick={() => setDays(7)}
				>
					7 Days
				</Button>
				<Button
					variant={days === 30 ? "default" : "outline"}
					size="sm"
					onClick={() => setDays(30)}
				>
					30 Days
				</Button>
			</div>
			<ResponsiveContainer width="100%" height={350}>
				<PieChart>
					<Pie
						data={chartData}
						cx="50%"
						cy="50%"
						innerRadius={60}
						outerRadius={100}
						paddingAngle={2}
						dataKey="value"
						label={({ name, percent }) =>
							`${name} ${(percent * 100).toFixed(0)}%`
						}
						labelLine={false}
					>
						{chartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
						))}
					</Pie>
					<Tooltip
						formatter={(value) => [`$${Number(value).toFixed(4)}`, "Cost"]}
					/>
					<Legend />
				</PieChart>
			</ResponsiveContainer>
			<div className="text-center mt-4">
				<p className="text-sm text-muted-foreground">
					Total Cost:{" "}
					<span className="font-medium">${totalCost.toFixed(4)}</span>
				</p>
			</div>
		</div>
	);
}
