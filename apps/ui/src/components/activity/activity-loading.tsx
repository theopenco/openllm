import { Skeleton } from "@/lib/components/skeleton";

export function ActivityLoading() {
	return (
		<div className="min-h-screen bg-neutral-950 text-white p-6">
			<div className="flex items-center justify-between mb-8">
				<Skeleton className="h-8 w-24 bg-neutral-800" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-6 w-6 rounded-full bg-neutral-800" />
					<Skeleton className="h-6 w-32 bg-neutral-800" />
				</div>
			</div>

			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<div>
						<Skeleton className="h-6 w-48 bg-neutral-800 mb-2" />
						<Skeleton className="h-4 w-64 bg-neutral-800" />
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-16 bg-neutral-800" />
							<Skeleton className="h-6 w-3 bg-neutral-800" />
						</div>
						<div className="flex gap-2">
							<Skeleton className="h-8 w-16 bg-neutral-700 rounded" />
							<Skeleton className="h-8 w-20 bg-neutral-800 rounded" />
						</div>
					</div>
				</div>

				<div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
					<div className="flex items-end justify-between h-64 mb-4">
						<div className="flex flex-col justify-between h-full text-sm text-neutral-500">
							<Skeleton className="h-3 w-4 bg-neutral-800" />
							<Skeleton className="h-3 w-4 bg-neutral-800" />
							<Skeleton className="h-3 w-4 bg-neutral-800" />
							<Skeleton className="h-3 w-4 bg-neutral-800" />
							<Skeleton className="h-3 w-4 bg-neutral-800" />
						</div>

						<div className="flex items-end gap-8 h-full flex-1 mx-8">
							{Array.from({ length: 7 }).map((_, i) => (
								<div
									key={i}
									className="flex flex-col items-center gap-2 flex-1"
								>
									<div
										className="w-full flex flex-col justify-end"
										style={{ height: `${Math.random() * 80 + 20}%` }}
									>
										<Skeleton className="w-full h-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" />
									</div>
									<Skeleton className="h-3 w-12 bg-neutral-800" />
								</div>
							))}
						</div>
					</div>

					<div className="flex flex-wrap gap-4 text-sm">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="flex items-center gap-2">
								<Skeleton className="h-3 w-3 bg-neutral-700 rounded-sm" />
								<Skeleton className="h-3 w-20 bg-neutral-800" />
							</div>
						))}
					</div>
				</div>
			</div>

			<div>
				<div className="flex items-center justify-between mb-4">
					<div>
						<Skeleton className="h-6 w-32 bg-neutral-800 mb-2" />
						<Skeleton className="h-4 w-56 bg-neutral-800" />
					</div>
					<Skeleton className="h-6 w-6 bg-neutral-800" />
				</div>

				{/* Filters */}
				<div className="flex gap-4 mb-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center gap-2">
							<Skeleton className="h-8 w-24 bg-neutral-800 rounded" />
							<Skeleton className="h-4 w-4 bg-neutral-800" />
						</div>
					))}
				</div>

				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="bg-neutral-900 rounded-lg p-4 border border-neutral-800"
						>
							<div className="flex items-start gap-4">
								<Skeleton className="h-8 w-8 rounded-full bg-neutral-700 flex-shrink-0" />

								<div className="flex-1">
									<div className="flex items-center justify-between mb-2">
										<Skeleton className="h-4 w-3/4 bg-neutral-800" />
										<Skeleton className="h-6 w-16 bg-neutral-700 rounded" />
									</div>

									<div className="flex items-center gap-6 text-sm text-neutral-400">
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-3 bg-neutral-700 rounded-full" />
											<Skeleton className="h-3 w-24 bg-neutral-800" />
										</div>
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-3 bg-neutral-700" />
											<Skeleton className="h-3 w-20 bg-neutral-800" />
										</div>
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-3 bg-neutral-700" />
											<Skeleton className="h-3 w-16 bg-neutral-800" />
										</div>
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-3 bg-neutral-700" />
											<Skeleton className="h-3 w-12 bg-neutral-800" />
										</div>
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-3 bg-neutral-700" />
											<Skeleton className="h-3 w-16 bg-neutral-800" />
										</div>
										<Skeleton className="h-3 w-20 bg-neutral-800 ml-auto" />
									</div>
								</div>

								<Skeleton className="h-4 w-4 bg-neutral-800" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
