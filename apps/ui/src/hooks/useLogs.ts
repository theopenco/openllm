import { useQuery } from "@tanstack/react-query";

import type { Log } from "@/lib/types";

export type LogsOrderBy = "createdAt_asc" | "createdAt_desc";

export interface FetchLogsOptions {
	orderBy?: LogsOrderBy;
}

export async function fetchLogs(options: FetchLogsOptions = {}) {
	const { orderBy = "createdAt_desc" } = options;

	const params = new URLSearchParams();
	params.append("orderBy", orderBy);

	const res = await fetch(`/api/content/logs?${params}`);
	if (!res.ok) {
		throw new Error("Failed to fetch logs");
	}

	const data: { logs: Log[] } = await res.json();

	return data.logs;
}

export function useLogs(options: FetchLogsOptions = {}) {
	const { orderBy = "createdAt_desc" } = options;

	return useQuery({
		queryKey: ["logs", { orderBy }],
		queryFn: () => fetchLogs(options),
	});
}
