import { useQuery } from "@tanstack/react-query";

import type { Log } from "@/lib/types";

export async function fetchLogs() {
	const res = await fetch(`/api/content/logs`);
	if (!res.ok) {
		throw new Error("Failed to fetch logs");
	}

	const data: { logs: Log[] } = await res.json();

	return data.logs;
}

export function useLogs() {
	return useQuery({
		queryKey: ["logs"],
		queryFn: fetchLogs,
	});
}
