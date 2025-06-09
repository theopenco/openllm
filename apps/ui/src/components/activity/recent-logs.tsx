import { models, providers } from "@llmgateway/models";
import { useState } from "react";

import { LogCard } from "../dashboard/log-card";
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

const UnifiedFinishReason = {
	COMPLETED: "completed",
	LENGTH_LIMIT: "length_limit",
	CONTENT_FILTER: "content_filter",
	GATEWAY_ERROR: "gateway_error",
	UPSTREAM_ERROR: "upstream_error",
	CANCELED: "canceled",
	UNKNOWN: "unknown",
} as const;
const FINISH_REASONS = ["stop", "length", "error", "content_filter"];

export function RecentLogs() {
	const [dateRange, setDateRange] = useState<DateRange | undefined>();
	const [finishReason, setFinishReason] = useState<string | undefined>();
	const [unifiedFinishReason, setUnifiedFinishReason] = useState<
		string | undefined
	>();
	const [provider, setProvider] = useState<string | undefined>();
	const [model, setModel] = useState<string | undefined>();

	const { data, isLoading, error } = $api.useSuspenseQuery("get", "/logs", {
		params: {
			query: {
				orderBy: "createdAt_desc",
				dateRange,
				finishReason,
				unifiedFinishReason,
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

				<Select
					onValueChange={setUnifiedFinishReason}
					value={unifiedFinishReason}
				>
					<SelectTrigger>
						<SelectValue placeholder="Filter by unified reason" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All unified reasons</SelectItem>
						{Object.entries(UnifiedFinishReason).map(([key, value]) => (
							<SelectItem key={value} value={value}>
								{key
									.toLowerCase()
									.replace(/_/g, " ")
									.replace(/\b\w/g, (l) => l.toUpperCase())}
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
						data.logs.map((log) => (
							<LogCard
								key={log.id}
								log={{
									...log,
									createdAt: new Date(log.createdAt),
									updatedAt: new Date(log.updatedAt),
									messages: log.messages as any,
									errorDetails: log.errorDetails as any,
								}}
							/>
						))
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
