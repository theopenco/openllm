import { useQuery } from "@tanstack/react-query";

import type { Log } from "@/lib/types";

export type LogsOrderBy = "createdAt_asc" | "createdAt_desc";

export interface FetchLogsOptions {
	orderBy?: LogsOrderBy;
	dateRange?: { start: Date; end: Date };
	finishReason?: string;
	provider?: string;
	model?: string;
}

export async function fetchLogs(options: FetchLogsOptions = {}) {
	const {
		orderBy = "createdAt_desc",
		dateRange,
		finishReason,
		provider,
		model,
	} = options;

	const params = new URLSearchParams();
	params.append("orderBy", orderBy);

	if (dateRange) {
		params.append("startDate", dateRange.start.toISOString());
		params.append("endDate", dateRange.end.toISOString());
	}

	if (finishReason && finishReason !== "all") {
		params.append("finishReason", finishReason);
	}
	if (provider && provider !== "all") {
		params.append("provider", provider);
	}
	if (model && model !== "all") {
		params.append("model", model);
	}

	const res = await fetch(`/api/logs?${params}`);
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Failed to fetch logs: ${errorText}`);
	}

	const data: { logs: Log[] } = await res.json();

	return data.logs;
}

export function useLogs(options: FetchLogsOptions = {}) {
	const {
		orderBy = "createdAt_desc",
		dateRange,
		finishReason,
		provider,
		model,
	} = options;

	return useQuery({
		queryKey: ["logs", { orderBy, dateRange, finishReason, provider, model }],
		queryFn: () => fetchLogs(options),
	});
}
