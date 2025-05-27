import { Skeleton } from "@/lib/components/skeleton";

export function SettingsLoading() {
	return (
		<div className="text-foreground p-4 md:p-6">
			<div className="mb-6">
				<Skeleton className="h-10 w-40" />
			</div>

			<div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-8 w-28 rounded-md" />
				))}
			</div>

			<div className="space-y-8 max-w-4xl">
				<div className="space-y-2 mb-6">
					<Skeleton className="h-7 w-36" />
					<Skeleton className="h-5 w-64 opacity-60" />
				</div>

				<div className="space-y-2 mb-6">
					<Skeleton className="h-7 w-36" />
					<Skeleton className="h-5 w-80 opacity-60" />
				</div>

				<div className="space-y-4 mb-8">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-start space-x-3">
							<Skeleton className="h-5 w-5 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-4 w-80 opacity-60" />
							</div>
						</div>
					))}
				</div>

				<Skeleton className="h-px w-full opacity-50 my-6" />

				<div className="flex justify-end mb-8">
					<Skeleton className="h-10 w-32 rounded-md" />
				</div>

				<div className="space-y-2 mb-6">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-5 w-72 opacity-60" />
				</div>

				<div className="flex items-center space-x-3 mb-6">
					<Skeleton className="h-5 w-5 rounded" />
					<Skeleton className="h-5 w-40" />
				</div>

				<div className="space-y-2 mb-4">
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-10 w-full max-w-xs rounded" />
					<Skeleton className="h-4 w-96 opacity-60" />
				</div>

				<div className="flex justify-end">
					<Skeleton className="h-10 w-32 rounded-md" />
				</div>
			</div>
		</div>
	);
}
