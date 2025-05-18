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

	function getProviderColor(provider: string) {
		const colorMap: Record<string, string> = {
			OpenAI: "#0ea5e9",
			Anthropic: "#8b5cf6",
			"Mistral AI": "#10b981",
			Meta: "#f59e0b",
			Google: "#ef4444",
			Azure: "#6366f1",
		};

		return colorMap[provider] || "#94a3b8"; // Default color for unknown providers
	}

	const totalCost = chartData.reduce((sum, item) => sum + item.value, 0);

	return (
		<div>
			<div className="flex items-center justify-end space-x-2 mb-4">
				<button
					className={`px-3 py-1 text-sm rounded-md ${
						days === 7 ? "bg-primary text-primary-foreground" : "bg-muted"
					}`}
					onClick={() => setDays(7)}
				>
					7 Days
				</button>
				<button
					className={`px-3 py-1 text-sm rounded-md ${
						days === 30 ? "bg-primary text-primary-foreground" : "bg-muted"
					}`}
					onClick={() => setDays(30)}
				>
					30 Days
				</button>
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
