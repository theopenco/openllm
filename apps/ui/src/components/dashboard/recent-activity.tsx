import { ActivityCard } from "./activity-card";
import { useActivityLogs } from "@/hooks/useActivityLogs";

export function RecentActivity() {
	const { data, isLoading, error } = useActivityLogs();

	if (isLoading) {
		return <div>Loading...</div>;
	}
	if (error) {
		return <div>Error loading activities</div>;
	}

	return (
		<div className="space-y-4">
			{data?.map((activity) => (
				<ActivityCard key={activity.id} activity={activity} />
			))}
		</div>
	);
}
