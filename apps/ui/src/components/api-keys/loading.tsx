import { MoreHorizontal, Plus } from "lucide-react";

import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Skeleton } from "@/lib/components/skeleton";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/lib/components/table";

export default function Loading() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
					<Button disabled>
						<Plus className="mr-2 h-4 w-4" />
						Create API Key
					</Button>
				</div>
				<Card>
					<CardHeader>
						<CardTitle>Your API Keys</CardTitle>
						<CardDescription>
							Manage your API keys for accessing LLM Gateway
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>API Key</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Last Used</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Restrictions</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{Array.from({ length: 4 }).map((_, index) => (
									<TableRow key={`skeleton-api-key-${index}`}>
										<TableCell>
											<Skeleton className="h-4 w-24" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-[167px]" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-[199px]" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-[199px]" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-16" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-[144px]" />
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												disabled
											>
												<MoreHorizontal className="h-4 w-4" />
												<span className="sr-only">Open menu</span>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
