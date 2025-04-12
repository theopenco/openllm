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
		requests: 120,
	},
	{
		date: "Jan 2",
		requests: 150,
	},
	{
		date: "Jan 3",
		requests: 180,
	},
	{
		date: "Jan 4",
		requests: 220,
	},
	{
		date: "Jan 5",
		requests: 250,
	},
	{
		date: "Jan 6",
		requests: 280,
	},
	{
		date: "Jan 7",
		requests: 300,
	},
	{
		date: "Jan 8",
		requests: 350,
	},
	{
		date: "Jan 9",
		requests: 380,
	},
	{
		date: "Jan 10",
		requests: 400,
	},
	{
		date: "Jan 11",
		requests: 450,
	},
	{
		date: "Jan 12",
		requests: 500,
	},
	{
		date: "Jan 13",
		requests: 520,
	},
	{
		date: "Jan 14",
		requests: 550,
	},
];

export function UsageChart() {
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
					tickFormatter={(value) => `${value}`}
				/>
				<Tooltip />
				<Line
					type="monotone"
					dataKey="requests"
					stroke="currentColor"
					className="stroke-primary"
					strokeWidth={2}
					dot={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
