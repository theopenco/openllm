import { Card, CardContent, CardHeader } from "@/lib/components/card";
import { Skeleton } from "@/lib/components/skeleton";

export function DashboardLoading() {
	return (
		<div className="min-h-screen bg-black text-white p-6">
			<div className="flex items-center justify-between mb-8">
				<Skeleton className="h-8 w-32 bg-gray-800" />
				<div className="flex items-center gap-4">
					<Skeleton className="h-9 w-32 bg-gray-800 rounded-lg" />
					<Skeleton className="h-9 w-32 bg-gray-800 rounded-lg" />
				</div>
			</div>

			<div className="flex gap-2 mb-6">
				<Skeleton className="h-10 w-24 bg-gray-800 rounded-lg" />
				<Skeleton className="h-10 w-28 bg-gray-800 rounded-lg" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i} className="bg-gray-900 border-gray-800">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<Skeleton className="h-4 w-24 bg-gray-700" />
								<Skeleton className="h-4 w-4 bg-gray-700" />
							</div>
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 bg-gray-700 mb-2" />
							<Skeleton className="h-3 w-20 bg-gray-700" />
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-2 bg-gray-900 border-gray-800">
					<CardHeader>
						<Skeleton className="h-6 w-32 bg-gray-700 mb-2" />
						<Skeleton className="h-4 w-24 bg-gray-700" />
					</CardHeader>
					<CardContent>
						<div className="h-64 flex items-end justify-between gap-4 px-4">
							{Array.from({ length: 7 }).map((_, i) => (
								<div key={i} className="flex flex-col items-center gap-2">
									<Skeleton
										className="w-8 bg-gray-700"
										style={{ height: `${Math.random() * 150 + 50}px` }}
									/>
									<Skeleton className="h-3 w-12 bg-gray-700" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gray-900 border-gray-800">
					<CardHeader>
						<Skeleton className="h-6 w-28 bg-gray-700 mb-2" />
						<Skeleton className="h-4 w-48 bg-gray-700" />
					</CardHeader>
					<CardContent className="space-y-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center gap-3 p-3 rounded-lg border border-gray-800"
							>
								<Skeleton className="h-4 w-4 bg-gray-700" />
								<Skeleton className="h-4 w-32 bg-gray-700" />
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
