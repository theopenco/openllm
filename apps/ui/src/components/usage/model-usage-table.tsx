import { Progress } from "@/lib/components/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/components/table";

const models = [
	{
		id: "1",
		name: "gpt-4o",
		provider: "OpenAI",
		requests: 1245,
		tokens: 450000,
		percentage: 45,
	},
	{
		id: "2",
		name: "claude-3-sonnet",
		provider: "Anthropic",
		requests: 876,
		tokens: 320000,
		percentage: 32,
	},
	{
		id: "3",
		name: "mistral-large",
		provider: "Mistral AI",
		requests: 543,
		tokens: 180000,
		percentage: 18,
	},
	{
		id: "4",
		name: "llama-3-70b",
		provider: "Meta",
		requests: 321,
		tokens: 50000,
		percentage: 5,
	},
];

export function ModelUsageTable() {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Model</TableHead>
					<TableHead>Provider</TableHead>
					<TableHead>Requests</TableHead>
					<TableHead>Tokens</TableHead>
					<TableHead>Usage</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{models.map((model) => (
					<TableRow key={model.id}>
						<TableCell className="font-medium">{model.name}</TableCell>
						<TableCell>{model.provider}</TableCell>
						<TableCell>{model.requests.toLocaleString()}</TableCell>
						<TableCell>{model.tokens.toLocaleString()}</TableCell>
						<TableCell className="w-[200px]">
							<div className="flex items-center gap-2">
								<Progress value={model.percentage} className="h-2" />
								<span className="text-muted-foreground w-10 text-xs">
									{model.percentage}%
								</span>
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
