import { createFileRoute } from "@tanstack/react-router";

import { Chat } from "@/components/Chat";

export const Route = createFileRoute("/chat")({
	component: () => (
		<div className="container py-8">
			<h1 className="text-3xl font-bold mb-8">Chat with AI</h1>
			<Chat />
		</div>
	),
});
