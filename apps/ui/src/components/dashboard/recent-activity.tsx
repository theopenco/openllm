import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";

const activities = [
	{
		id: "1",
		type: "request",
		model: "gpt-4o",
		status: "success",
		time: "2 minutes ago",
		message: "Successful API request to OpenAI",
	},
	{
		id: "2",
		type: "request",
		model: "claude-3-sonnet",
		status: "error",
		time: "15 minutes ago",
		message: "Rate limit exceeded on Anthropic API",
	},
	{
		id: "3",
		type: "system",
		status: "info",
		time: "1 hour ago",
		message: "New provider added: Mistral AI",
	},
	{
		id: "4",
		type: "request",
		model: "mistral-large",
		status: "success",
		time: "2 hours ago",
		message: "Successful API request to Mistral AI",
	},
	{
		id: "5",
		type: "system",
		status: "info",
		time: "1 day ago",
		message: "API key created: Development API Key",
	},
];

export function RecentActivity() {
	return (
		<div className="space-y-4">
			{activities.map((activity) => (
				<div
					key={activity.id}
					className="flex items-start gap-4 rounded-lg border p-4"
				>
					<div className="mt-0.5">
						{activity.status === "success" ? (
							<CheckCircle2 className="h-5 w-5 text-green-500" />
						) : activity.status === "error" ? (
							<AlertCircle className="h-5 w-5 text-red-500" />
						) : (
							<Activity className="h-5 w-5 text-blue-500" />
						)}
					</div>
					<div className="flex-1 space-y-1">
						<p className="text-sm font-medium leading-none">
							{activity.message}
						</p>
						<div className="flex items-center pt-1">
							{activity.type === "request" && (
								<span className="text-muted-foreground text-xs">
									Model: {activity.model}
								</span>
							)}
							<span className="text-muted-foreground ml-auto text-xs">
								{activity.time}
							</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
