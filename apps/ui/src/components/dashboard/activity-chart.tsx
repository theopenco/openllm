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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";

import type { TooltipProps } from "recharts";

interface CustomTooltipProps extends TooltipProps<number, string> {
	active?: boolean;
	payload?: any[];
	label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div className="rounded-lg border bg-popover text-popover-foreground p-2 shadow-sm">
				<p className="font-medium">
					{label && format(parseISO(label), "MMM d, yyyy")}
				</p>
				<p className="text-sm">
					<span className="font-medium">{data.requestCount}</span> requests
				</p>
				<p className="text-sm">
					<span className="font-medium">
						{data.totalTokens.toLocaleString()}
					</span>{" "}
					tokens
				</p>
				<p className="text-sm">
					<span className="font-medium">${data.cost.toFixed(4)}</span> estimated
					cost
				</p>
			</div>
		);
	}

	return null;
};

export function ActivityChart() {
	const [days, setDays] = useState<7 | 30>(7);
	const { data, isLoading, error } = useActivity(days);

	if (isLoading) {
		return (
			<div className="flex h-[350px] items-center justify-center">
				Loading activity data...
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
				<p className="text-muted-foreground">No activity data available</p>
			</div>
		);
	}

	// Generate a complete date range for the selected period
	const today = new Date();
	const startDate = subDays(today, days - 1);
	const dateRange: string[] = [];

	// Create an array of all dates in the range
	for (let i = 0; i < days; i++) {
		const date = addDays(startDate, i);
		dateRange.push(format(date, "yyyy-MM-dd"));
	}

	// Create a map of existing data by date
	const dataByDate = new Map(data.map((item) => [item.date, item]));

	// Fill in the chart data with all dates, using zero values for missing dates
	const chartData = dateRange.map((date) => {
		if (dataByDate.has(date)) {
			return {
				...dataByDate.get(date),
				formattedDate: format(parseISO(date), "MMM d"),
			};
		}
		return {
			date,
			formattedDate: format(parseISO(date), "MMM d"),
			requestCount: 0,
			inputTokens: 0,
			outputTokens: 0,
			totalTokens: 0,
			cost: 0,
			modelBreakdown: [],
		};
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div>
					<CardTitle>Activity Overview</CardTitle>
					<CardDescription>
						Request volume over the last {days} days
					</CardDescription>
				</div>
				<div className="flex space-x-2">
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
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={350}>
					<BarChart data={chartData}>
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
							tickFormatter={(value) => `${value}`}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Bar
							dataKey="requestCount"
							name="Requests"
							fill="currentColor"
							radius={[4, 4, 0, 0]}
							className="fill-primary opacity-80 hover:opacity-100 transition-opacity"
						/>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
