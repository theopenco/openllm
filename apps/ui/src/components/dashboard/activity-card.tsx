import { formatDistanceToNow } from "date-fns";
import {
	Activity,
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Code,
	Cpu,
	Zap,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/lib/components/tooltip";

import type { ActivityLog } from "@/lib/types";

export function ActivityCard({ activity }: { activity: ActivityLog }) {
	const [isExpanded, setIsExpanded] = useState(false);

	const formattedTime = formatDistanceToNow(new Date(activity.createdAt), {
		addSuffix: true,
	});

	// Determine the status icon and color
	const getStatusDetails = (status: string) => {
		switch (status) {
			case "success":
				return {
					icon: CheckCircle2,
					color: "text-green-500",
					bgColor: "bg-green-50 dark:bg-green-950/30",
				};
			case "error":
				return {
					icon: AlertCircle,
					color: "text-red-500",
					bgColor: "bg-red-50 dark:bg-red-950/30",
				};
			case "warning":
				return {
					icon: AlertCircle,
					color: "text-yellow-500",
					bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
				};
			default:
				return {
					icon: Activity,
					color: "text-blue-500",
					bgColor: "bg-blue-50 dark:bg-blue-950/30",
				};
		}
	};

	const { icon: StatusIcon, color, bgColor } = getStatusDetails("success");

	const formatDuration = (ms: number) => {
		if (ms < 1000) {
			return `${ms}ms`;
		}
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
			<div
				className={`flex items-start gap-4 p-4 ${isExpanded ? "border-b" : ""}`}
			>
				<div className={`mt-0.5 rounded-full p-1.5 ${bgColor}`}>
					<StatusIcon className={`h-5 w-5 ${color}`} />
				</div>
				<div className="flex-1 space-y-1">
					<div className="flex items-center justify-between">
						<p className="font-medium">{activity.content}</p>
						<Badge
							// variant={
							//   activity.status === "success" ? "default" : activity.status === "error" ? "destructive" : "outline"
							// }
							variant="default"
							className="ml-2"
						>
							{activity.finishReason}
						</Badge>
					</div>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-muted-foreground">
						<div className="flex items-center gap-1">
							<Cpu className="h-3.5 w-3.5" />
							<span>{activity.usedModel}</span>
						</div>
						<div className="flex items-center gap-1">
							<Zap className="h-3.5 w-3.5" />
							<span>{activity.totalTokens} tokens</span>
						</div>
						<div className="flex items-center gap-1">
							<Clock className="h-3.5 w-3.5" />
							<span>{formatDuration(activity.duration)}</span>
						</div>
						<div className="flex items-center gap-1">
							<Code className="h-3.5 w-3.5" />
							<span>{activity.apiKeyId}</span>
						</div>
						<span className="ml-auto">{formattedTime}</span>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0"
					onClick={toggleExpand}
				>
					{isExpanded ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
					<span className="sr-only">Toggle details</span>
				</Button>
			</div>

			{isExpanded && (
				<div className="space-y-4 p-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<h4 className="text-sm font-medium">Request Details</h4>
							<div className="grid grid-cols-2 gap-2 rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">Project ID</div>
								<div className="font-mono text-xs">{activity.projectId}</div>
								<div className="text-muted-foreground">API Key</div>
								<div className="font-mono text-xs">{activity.apiKeyId}</div>
								<div className="text-muted-foreground">Provider Key</div>
								<div className="font-mono text-xs">
									{activity.providerKeyId}
								</div>
								<div className="text-muted-foreground">Requested Model</div>
								<div>{activity.requestedModel}</div>
								<div className="text-muted-foreground">Used Model</div>
								<div>{activity.usedModel}</div>
								<div className="text-muted-foreground">Provider</div>
								<div>{activity.usedProvider}</div>
							</div>
						</div>
						<div className="space-y-2">
							<h4 className="text-sm font-medium">Response Metrics</h4>
							<div className="grid grid-cols-2 gap-2 rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">Duration</div>
								<div>{formatDuration(activity.duration)}</div>
								<div className="text-muted-foreground">Response Size</div>
								<div>{activity.responseSize} bytes</div>
								<div className="text-muted-foreground">Prompt Tokens</div>
								<div>{activity.promptTokens}</div>
								<div className="text-muted-foreground">Completion Tokens</div>
								<div>{activity.completionTokens}</div>
								<div className="text-muted-foreground">Total Tokens</div>
								<div className="font-medium">{activity.totalTokens}</div>
								<div className="text-muted-foreground">Finish Reason</div>
								<div>{activity.finishReason}</div>
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<h4 className="text-sm font-medium">Model Parameters</h4>
						<div className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2 md:grid-cols-4">
							<TooltipProvider>
								<div className="flex items-center justify-between gap-2">
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="text-muted-foreground">Temperature</span>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-xs text-xs">
												Controls randomness: higher values produce more random
												outputs
											</p>
										</TooltipContent>
									</Tooltip>
									<span>{activity.temperature}</span>
								</div>
								<div className="flex items-center justify-between gap-2">
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="text-muted-foreground">Max Tokens</span>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-xs text-xs">
												Maximum number of tokens to generate
											</p>
										</TooltipContent>
									</Tooltip>
									<span>{activity.maxTokens}</span>
								</div>
								<div className="flex items-center justify-between gap-2">
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="text-muted-foreground">Top P</span>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-xs text-xs">
												Alternative to temperature, controls diversity via
												nucleus sampling
											</p>
										</TooltipContent>
									</Tooltip>
									<span>{activity.topP}</span>
								</div>
								<div className="flex items-center justify-between gap-2">
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="text-muted-foreground">
												Frequency Penalty
											</span>
										</TooltipTrigger>
										<TooltipContent>
											<p className="max-w-xs text-xs">
												Decreases the likelihood of repeating the same tokens
											</p>
										</TooltipContent>
									</Tooltip>
									<span>{activity.frequencyPenalty}</span>
								</div>
							</TooltipProvider>
						</div>
					</div>
					<div className="space-y-2">
						<h4 className="text-sm font-medium">Message Context</h4>
						{activity.messages.map((item) => (
							<div
								key={`message-${item.content[0]}`}
								className="rounded-md border p-3"
							>
								<p className="text-sm">{item.content}</p>
								<p>{item.role}</p>
							</div>
						))}
					</div>
					{/* <div className="flex justify-end">
						<Button variant="outline" size="sm">
							View Full Log
						</Button>
					</div> */}
				</div>
			)}
		</div>
	);
}
