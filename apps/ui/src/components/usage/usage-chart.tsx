import { addDays, format, parseISO, subDays } from "date-fns";
import { useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { useActivity } from "@/hooks/useActivity";
import { Button } from "@/lib/components/button";

export function UsageChart() {
	const [days, setDays] = useState<7 | 30>(7);
	const { data, isLoading, error } = useActivity(days);

	if (isLoading) {
		return (
			<div className="flex h-[350px] items-center justify-center">
				Loading usage data...
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
				<p className="text-muted-foreground">No usage data available</p>
			</div>
		);
	}

	const today = new Date();
	const startDate = subDays(today, days - 1);
	const dateRange: string[] = [];

	for (let i = 0; i < days; i++) {
		const date = addDays(startDate, i);
		dateRange.push(format(date, "yyyy-MM-dd"));
	}

	const dataByDate = new Map(data.map((item) => [item.date, item]));

	const chartData = dateRange.map((date) => {
		if (dataByDate.has(date)) {
			const dayData = dataByDate.get(date)!;
			return {
				date,
				formattedDate: format(parseISO(date), "MMM d"),
				requests: dayData.requestCount,
			};
		}
		return {
			date,
			formattedDate: format(parseISO(date), "MMM d"),
			requests: 0,
		};
	});

	return (
		<div className="flex flex-col">
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
				<BarChart
					data={chartData}
					margin={{
						top: 5,
						right: 10,
						left: 10,
						bottom: 0,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis
						dataKey="date"
						tickFormatter={(value) => format(parseISO(value), "MMM d")}
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
					/>
					<Tooltip
						formatter={(value) => [value, "Requests"]}
						labelFormatter={(label) => format(parseISO(label), "MMM d, yyyy")}
					/>
					<Bar
						dataKey="requests"
						fill="currentColor"
						className="fill-primary"
						radius={[4, 4, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
