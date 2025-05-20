import { useQuery } from "@tanstack/react-query";

export interface ActivityModelUsage {
	model: string;
	provider: string;
	requestCount: number;
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cost: number;
}

export interface DailyActivity {
	date: string;
	requestCount: number;
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cost: number;
	outputCost: number;
	inputCost: number;
	errorCount: number;
	errorRate: number;
	modelBreakdown: ActivityModelUsage[];
}

export interface ActivityResponse {
	activity: DailyActivity[];
}

export async function fetchActivity(days = 7) {
	const params = new URLSearchParams();
	params.append("days", days.toString());

	const res = await fetch(`/api/activity?${params}`);
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Failed to fetch activity data: ${errorText}`);
	}

	const data: ActivityResponse = await res.json();
	return data.activity;
}

export function useActivity(days = 7) {
	return useQuery({
		queryKey: ["activity", { days }],
		queryFn: () => fetchActivity(days),
	});
}
