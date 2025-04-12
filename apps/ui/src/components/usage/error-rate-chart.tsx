import {
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const data = [
	{
		date: "Jan 1",
		errorRate: 2.5,
	},
	{
		date: "Jan 2",
		errorRate: 3.1,
	},
	{
		date: "Jan 3",
		errorRate: 2.8,
	},
	{
		date: "Jan 4",
		errorRate: 1.9,
	},
	{
		date: "Jan 5",
		errorRate: 2.2,
	},
	{
		date: "Jan 6",
		errorRate: 3.5,
	},
	{
		date: "Jan 7",
		errorRate: 4.1,
	},
	{
		date: "Jan 8",
		errorRate: 3.8,
	},
	{
		date: "Jan 9",
		errorRate: 2.5,
	},
	{
		date: "Jan 10",
		errorRate: 1.8,
	},
	{
		date: "Jan 11",
		errorRate: 1.5,
	},
	{
		date: "Jan 12",
		errorRate: 1.2,
	},
	{
		date: "Jan 13",
		errorRate: 1.0,
	},
	{
		date: "Jan 14",
		errorRate: 0.8,
	},
];

export function ErrorRateChart() {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart
				data={data}
				margin={{
					top: 5,
					right: 10,
					left: 10,
					bottom: 0,
				}}
			>
				<XAxis
					dataKey="date"
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
					tickFormatter={(value) => `${value}%`}
				/>
				<Tooltip />
				<Line
					type="monotone"
					dataKey="errorRate"
					stroke="currentColor"
					className="stroke-destructive"
					strokeWidth={2}
					dot={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
