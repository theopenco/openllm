import { Link } from "@tanstack/react-router";

import { Button } from "@/lib/components/button";
import Logo from "@/lib/icons/Logo";

export const AppHeader = () => (
	<header className="sticky top-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-sm">
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div className="flex items-center justify-between h-16">
				<div className="flex items-center space-x-8">
					<Link
						to="/"
						className="flex items-center space-x-2 text-lg font-semibold"
					>
						<Logo className="h-6 w-6" />
						<span>LLM Gateway</span>
					</Link>
					<nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-300">
						<Link to="/models" className="hover:text-white transition-colors">
							Models
						</Link>
						<Link
							to="/playground"
							className="hover:text-white transition-colors"
						>
							Playground
						</Link>
						<Link
							to="/changelog"
							className="hover:text-white transition-colors"
						>
							Changelog
						</Link>
					</nav>
				</div>
				<div className="flex items-center space-x-4">
					<Link
						to="/login"
						className="hidden sm:inline-block text-sm font-medium text-gray-300 hover:text-white transition-colors"
					>
						Log in
					</Link>
					<Button
						asChild
						variant="secondary"
						className="bg-white text-black hover:bg-gray-200 rounded-md text-sm font-medium"
					>
						<Link to="/signup">Sign up</Link>
					</Button>
				</div>
			</div>
		</div>
	</header>
);
