import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

const data = [
	{ name: "OpenAI", value: 45, color: "#0ea5e9" },
	{ name: "Anthropic", value: 30, color: "#8b5cf6" },
	{ name: "Mistral AI", value: 15, color: "#10b981" },
	{ name: "Meta", value: 10, color: "#f59e0b" },
];

export function CostBreakdownChart() {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<PieChart>
				<Pie
					data={data}
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
					{data.map((entry, index) => (
						<Cell key={`cell-${index}`} fill={entry.color} />
					))}
				</Pie>
				<Tooltip
					formatter={(value) => `$${(Number(value) * 0.245).toFixed(2)}`}
				/>
				<Legend />
			</PieChart>
		</ResponsiveContainer>
	);
}
