import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<main className="grid h-screen place-items-center">
			<div className="flex items-center self-center">
				<div className="flex flex-col items-center">
					<Link to="/dashboard" className="text-blue-500 underline">
						Dashboard
					</Link>
					<Link to="/login" className="text-blue-500 underline">
						Login
					</Link>
				</div>
			</div>
		</main>
	);
}
