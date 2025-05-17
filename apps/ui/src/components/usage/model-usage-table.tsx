import { useState } from "react";

import { useActivity } from "@/hooks/useActivity";
import { Progress } from "@/lib/components/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/components/table";

import type { ActivityModelUsage } from "@/hooks/useActivity";

export function ModelUsageTable() {
	const [days, setDays] = useState<7 | 30>(7);
	const { data, isLoading, error } = useActivity(days);

	if (isLoading) {
		return (
			<div className="flex h-[350px] items-center justify-center">
				Loading model usage data...
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
				<p className="text-muted-foreground">No model usage data available</p>
			</div>
		);
	}

	const modelMap = new Map<string, ActivityModelUsage>();

	data.forEach((day) => {
		day.modelBreakdown.forEach((model) => {
			const key = `${model.provider}|${model.model}`;
			if (modelMap.has(key)) {
				const existing = modelMap.get(key)!;
				existing.requestCount += model.requestCount;
				existing.inputTokens += model.inputTokens;
				existing.outputTokens += model.outputTokens;
				existing.totalTokens += model.totalTokens;
				existing.cost += model.cost;
			} else {
				modelMap.set(key, { ...model });
			}
		});
	});

	const models = Array.from(modelMap.values()).sort(
		(a, b) => b.totalTokens - a.totalTokens,
	);

	const totalTokens = models.reduce((sum, model) => sum + model.totalTokens, 0);

	return (
		<div>
			<div className="flex items-center justify-end space-x-2 mb-4">
				<button
					className={`px-3 py-1 text-sm rounded-md ${
						days === 7 ? "bg-primary text-primary-foreground" : "bg-muted"
					}`}
					onClick={() => setDays(7)}
				>
					7 Days
				</button>
				<button
					className={`px-3 py-1 text-sm rounded-md ${
						days === 30 ? "bg-primary text-primary-foreground" : "bg-muted"
					}`}
					onClick={() => setDays(30)}
				>
					30 Days
				</button>
			</div>
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
					{models.map((model, index) => {
						const percentage =
							totalTokens === 0
								? 0
								: Math.round((model.totalTokens / totalTokens) * 100);
						return (
							<TableRow key={`${model.provider}-${model.model}-${index}`}>
								<TableCell className="font-medium">{model.model}</TableCell>
								<TableCell>{model.provider}</TableCell>
								<TableCell>{model.requestCount.toLocaleString()}</TableCell>
								<TableCell>{model.totalTokens.toLocaleString()}</TableCell>
								<TableCell className="w-[200px]">
									<div className="flex items-center gap-2">
										<Progress value={percentage} className="h-2" />
										<span className="text-muted-foreground w-10 text-xs">
											{percentage}%
										</span>
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
