import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";

import { useActivity } from "@/hooks/useActivity";
import { Button } from "@/lib/components/button";
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

type SortColumn = "model" | "provider" | "requestCount" | "totalTokens";
type SortDirection = "asc" | "desc";

export function ModelUsageTable() {
	const [days, setDays] = useState<7 | 30>(7);
	const [sortColumn, setSortColumn] = useState<SortColumn>("totalTokens");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const { data, isLoading, error } = useActivity(days);

	const handleSort = (column: SortColumn) => {
		if (sortColumn === column) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortColumn(column);
			setSortDirection(
				column === "model" || column === "provider" ? "asc" : "desc",
			);
		}
	};

	const getSortIcon = (column: SortColumn) => {
		if (sortColumn !== column) {
			return <ArrowUpDown className="ml-2 h-4 w-4" />;
		}
		return sortDirection === "asc" ? (
			<ArrowUp className="ml-2 h-4 w-4" />
		) : (
			<ArrowDown className="ml-2 h-4 w-4" />
		);
	};

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

	const sortedModels = Array.from(modelMap.values()).sort((a, b) => {
		const aValue = a[sortColumn];
		const bValue = b[sortColumn];

		if (typeof aValue === "string" && typeof bValue === "string") {
			return sortDirection === "asc"
				? aValue.localeCompare(bValue)
				: bValue.localeCompare(aValue);
		} else {
			return sortDirection === "asc"
				? (aValue as number) - (bValue as number)
				: (bValue as number) - (aValue as number);
		}
	});

	const totalTokens = sortedModels.reduce(
		(sum, model) => sum + model.totalTokens,
		0,
	);

	return (
		<div>
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
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Button
								variant="ghost"
								onClick={() => handleSort("model")}
								className="flex items-center p-0 h-auto font-semibold"
							>
								Model
								{getSortIcon("model")}
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								onClick={() => handleSort("provider")}
								className="flex items-center p-0 h-auto font-semibold"
							>
								Provider
								{getSortIcon("provider")}
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								onClick={() => handleSort("requestCount")}
								className="flex items-center p-0 h-auto font-semibold"
							>
								Requests
								{getSortIcon("requestCount")}
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								onClick={() => handleSort("totalTokens")}
								className="flex items-center p-0 h-auto font-semibold"
							>
								Tokens
								{getSortIcon("totalTokens")}
							</Button>
						</TableHead>
						<TableHead>Usage</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedModels.map((model, index) => {
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
