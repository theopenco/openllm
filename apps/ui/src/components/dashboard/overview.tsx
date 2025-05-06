import React from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { DailyActivity } from "@/hooks/useActivity";

interface OverviewProps {
	data: DailyActivity[] | undefined;
}

export function Overview({ data }: OverviewProps) {
	const chartData = data?.map((activity) => ({
		name: new Date(activity.date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
		total: activity.requestCount,
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
					tickFormatter={(value: number) => `${value}`}
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
