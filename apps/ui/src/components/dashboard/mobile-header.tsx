import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

import { SidebarTrigger } from "@/lib/components/sidebar";

export function MobileHeader() {
	return (
		<header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static md:hidden">
			<SidebarTrigger />
			<Link to="/dashboard" className="flex items-center gap-2 font-semibold">
				<Zap className="h-5 w-5" />
				<span>OpenLLM</span>
			</Link>
			{/* <div className="flex flex-1 items-center justify-end gap-2">
        <ModeToggle />
      </div> */}
		</header>
	);
}
