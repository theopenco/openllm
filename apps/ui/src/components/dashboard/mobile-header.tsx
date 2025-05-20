import { Link } from "@tanstack/react-router";

import { ModeToggle } from "@/components/mode-toggle";
import { SidebarTrigger } from "@/lib/components/sidebar";
import Logo from "@/lib/icons/Logo";

export function MobileHeader() {
	return (
		<header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static md:hidden">
			<SidebarTrigger />
			<Link to="/dashboard" className="flex items-center gap-2 font-semibold">
				<Logo className="h-6 w-6 rounded-full text-black dark:text-white" />
				<span>LLM Gateway</span>
			</Link>
			<div className="flex flex-1 items-center justify-end gap-2">
				<ModeToggle />
			</div>
		</header>
	);
}
