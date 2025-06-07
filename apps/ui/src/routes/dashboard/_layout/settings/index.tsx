import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/_layout/settings/")({
	beforeLoad: () => {
		throw redirect({
			to: "/dashboard/settings/preferences",
		});
	},
});
