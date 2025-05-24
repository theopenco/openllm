import { addDays, format, parseISO, subDays } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { DailyActivity } from "@/types/activity";

interface OverviewProps {
	data?: DailyActivity[];
	isLoading?: boolean;
	days?: 7 | 30;
}

export function Overview({ data, isLoading = false, days = 7 }: OverviewProps) {
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

	// Generate a complete date range for the selected period to ensure consistent rendering
	const today = new Date();
	const startDate = subDays(today, days - 1);
	const dateRange: string[] = [];

	// Create an array of all dates in the range
	for (let i = 0; i < days; i++) {
		const date = addDays(startDate, i);
		dateRange.push(format(date, "yyyy-MM-dd"));
	}

	// Create a map of existing data by date
	const dataByDate = new Map(data.map((day) => [day.date, day]));

	// Fill in the chart data with all dates, using zero values for missing dates
	const chartData = dateRange.map((date) => {
		if (dataByDate.has(date)) {
			return {
				name: format(parseISO(date), "MMM d"),
				total: dataByDate.get(date)!.requestCount,
				tokens: dataByDate.get(date)!.totalTokens,
				cost: dataByDate.get(date)!.cost,
			};
		}

		return {
			name: format(parseISO(date), "MMM d"),
			total: 0,
			tokens: 0,
			cost: 0,
		};
	});

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
