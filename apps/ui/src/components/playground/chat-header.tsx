import { ModelSelector } from "./model-selector";
import { SidebarTrigger } from "@/lib/components/sidebar";

interface ChatHeaderProps {
	selectedModel: string;
	onModelSelect: (model: string) => void;
}

export function ChatHeader({ selectedModel, onModelSelect }: ChatHeaderProps) {
	const handleModelSelect = (model: string) => {
		onModelSelect(model);
	};

	return (
		<header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex items-center gap-4">
				<SidebarTrigger />
				<h1 className="text-xl font-semibold">AI Chat</h1>
			</div>
			<ModelSelector
				selectedModel={selectedModel}
				onModelSelect={handleModelSelect}
			/>
		</header>
	);
}
