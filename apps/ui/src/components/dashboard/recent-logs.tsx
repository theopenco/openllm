import { LogCard } from "./log-card";
import { useLogs } from "@/hooks/useLogs";

export function RecentLogs() {
	const { data, isLoading, error } = useLogs({ orderBy: "createdAt_desc" });

	if (isLoading) {
		return <div>Loading...</div>;
	}
	if (error) {
		return <div>Error loading logs</div>;
	}

	return (
		<div className="space-y-4">
			{data?.map((log) => <LogCard key={log.id} log={log} />)}
		</div>
	);
}
