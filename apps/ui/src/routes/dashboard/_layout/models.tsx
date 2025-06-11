import { createFileRoute } from "@tanstack/react-router";

import { ModelsSupported } from "@/components/models-supported";

export const Route = createFileRoute("/dashboard/_layout/models")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Models</h2>
				</div>
				<ModelsSupported isDashboard />
			</div>
		</div>
	);
}
