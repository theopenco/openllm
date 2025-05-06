import { format, parseISO } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { DailyActivity } from "@/hooks/useActivity";

interface OverviewProps {
	data?: DailyActivity[];
	isLoading?: boolean;
}

export function Overview({ data, isLoading = false }: OverviewProps) {
	if (isLoading) {
		return (
			<div className="flex h-[350px] items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="flex h-[350px] items-center justify-center">
				<p className="text-muted-foreground">No activity data available</p>
			</div>
		);
	}

	// Transform activity data for the chart
	const chartData = data.map((day) => ({
		name: format(parseISO(day.date), "MMM d"),
		total: day.requestCount,
		tokens: day.totalTokens,
		cost: day.cost,
	}));

	return (
		<ResponsiveContainer width="100%" height={350}>
			<BarChart data={chartData}>
				<XAxis
					dataKey="name"
					stroke="#888888"
					fontSize={12}
					tickLine={false}
					axisLine={false}
				/>
				<YAxis
					stroke="#888888"
					fontSize={12}
					tickLine={false}
					axisLine={false}
					tickFormatter={(value) => `${value}`}
				/>
				<Bar
					dataKey="total"
					fill="currentColor"
					radius={[4, 4, 0, 0]}
					className="fill-primary"
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}
