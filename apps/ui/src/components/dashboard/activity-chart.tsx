import { format, parseISO } from "date-fns";
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
			<div className="rounded-lg border bg-card p-2 shadow-sm">
				<p className="font-medium">{format(parseISO(label), "MMM d, yyyy")}</p>
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						{data.requestCount}
					</span>{" "}
					requests
				</p>
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						{data.totalTokens.toLocaleString()}
					</span>{" "}
					tokens
				</p>
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						${data.cost.toFixed(4)}
					</span>{" "}
					estimated cost
				</p>
			</div>
		);
	}

	return null;
};

export function ActivityChart() {
	const { data, isLoading, error } = useActivity(30);

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

	// Format dates for display
	const chartData = data.map((item) => ({
		...item,
		formattedDate: format(parseISO(item.date), "MMM d"),
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle>Activity Overview</CardTitle>
				<CardDescription>Request volume over the last 30 days</CardDescription>
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
							className="fill-primary"
						/>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
