import { models, providers } from "@openllm/models";
import { useState } from "react";

import { LogCard } from "./log-card";
import {
	type DateRange,
	DateRangeSelect,
} from "@/components/date-range-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";
import { $api } from "@/lib/fetch-client";

const FINISH_REASONS = ["stop", "length", "error", "content_filter"];

export function RecentLogs() {
	const [dateRange, setDateRange] = useState<DateRange | undefined>();
	const [finishReason, setFinishReason] = useState<string | undefined>();
	const [provider, setProvider] = useState<string | undefined>();
	const [model, setModel] = useState<string | undefined>();

	const { data, isLoading, error } = $api.useSuspenseQuery("get", "/logs", {
		params: {
			query: {
				orderBy: "createdAt_desc",
				dateRange,
				finishReason,
				provider,
				model,
			},
		},
	});

	const handleDateRangeChange = (_value: string, range: DateRange) => {
		setDateRange(range);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2 mb-4">
				<DateRangeSelect onChange={handleDateRangeChange} value="24h" />

				<Select onValueChange={setFinishReason} value={finishReason}>
					<SelectTrigger>
						<SelectValue placeholder="Filter by reason" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All reasons</SelectItem>
						{FINISH_REASONS.map((reason) => (
							<SelectItem key={reason} value={reason}>
								{reason}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select onValueChange={setProvider} value={provider}>
					<SelectTrigger>
						<SelectValue placeholder="Filter by provider" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All providers</SelectItem>
						{providers.map((p) => (
							<SelectItem key={p.id} value={p.id}>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select onValueChange={setModel} value={model}>
					<SelectTrigger>
						<SelectValue placeholder="Filter by model" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All models</SelectItem>
						{models.map((m) => (
							<SelectItem key={m.model} value={m.model}>
								{m.model}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<div>Loading...</div>
			) : error ? (
				<div>Error loading logs</div>
			) : (
				<div className="space-y-4">
					{data?.logs.length ? (
						data.logs.map((log) => <LogCard key={log.id} log={log} />)
					) : (
						<div className="py-4 text-center text-muted-foreground">
							No logs found matching the selected filters.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
