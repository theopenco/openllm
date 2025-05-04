import { useQuery } from "@tanstack/react-query";

import type { ActivityLog } from "@/lib/types";

export async function fetchActivityLogs() {
	const res = await fetch(`/api/content/activity`);
	if (!res.ok) {
		throw new Error("Failed to fetch activity logs");
	}

	const data: { logs: ActivityLog[] } = await res.json();

	return data.logs;
}

export function useActivityLogs() {
	return useQuery({
		queryKey: ["activityLogs"],
		queryFn: fetchActivityLogs,
	});
}
