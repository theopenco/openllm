import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ChatHeader } from "@/components/playground/chat-header";
import { ChatUi } from "@/components/playground/chat-ui";
import { ChatSidebar } from "@/components/playground/sidebar";
import { SidebarProvider } from "@/lib/components/sidebar";

export interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: Date;
}

export const Route = createFileRoute("/playground")({
	component: RouteComponent,
});

function RouteComponent() {
	const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentChatId, setCurrentChatId] = useState<string | null>(null);

	const handleModelSelect = (model: string) => {
		setSelectedModel(model);
	};

	const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
		const newMessage: Message = {
			...message,
			id: Date.now().toString(),
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, newMessage]);
		return newMessage;
	};

	const handleSendMessage = async (content: string) => {
		if (!content.trim()) {
			return;
		}

		setIsLoading(true);
		addMessage({ role: "user", content });

		try {
			const response = await fetch("/api/chat/completion", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: selectedModel,
					messages: [...messages, { role: "user", content }].map((msg) => ({
						role: msg.role,
						content: msg.content,
					})),
					stream: true, // Enable streaming
				}),
			});

			if (!response.ok) {
				throw new Error(`API Error: ${response.status} ${response.statusText}`);
			}

			// Handle streaming response
			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("No response body");
			}

			const assistantMessage = addMessage({ role: "assistant", content: "" });
			let assistantContent = "";

			const decoder = new TextDecoder();
			let buffer = "";

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						break;
					}

					const chunk = decoder.decode(value, { stream: true });
					buffer += chunk;
					const lines = buffer.split("\n");
					buffer = lines.pop() || "";

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							const data = line.slice(6);
							if (data === "[DONE]") {
								continue;
							}

							try {
								const parsed = JSON.parse(data);
								const content = parsed.choices?.[0]?.delta?.content;
								if (content) {
									assistantContent += content;
									setMessages((prev) =>
										prev.map((msg) =>
											msg.id === assistantMessage.id
												? { ...msg, content: assistantContent }
												: msg,
										),
									);
								}
							} catch (_e) {
								// Ignore parse errors for streaming chunks
							}
						}
					}
				}
			} catch (streamError) {
				console.error("Streaming error:", streamError);
				// If streaming fails, try to get whatever content we have
				if (!assistantContent.trim()) {
					throw streamError;
				}
			}
		} catch (error) {
			console.warn("API failed, using mock response:", error);

			// Simulate streaming for fallback response
			const mockResponses = [
				"I'm GPT-4o-mini, a language model created by OpenAI.",
				"I'm an AI assistant based on GPT-4o-mini. How can I help you?",
				"I'm a large language model called GPT-4o-mini. What would you like to know?",
				"I'm an AI assistant. I can help you with various tasks and questions.",
				"I'm GPT-4o-mini, an AI language model. How may I assist you today?",
			];

			const response =
				mockResponses[Math.floor(Math.random() * mockResponses.length)];
			const assistantMessage = addMessage({ role: "assistant", content: "" });

			// Simulate typing effect for mock response
			for (let i = 0; i <= response.length; i++) {
				await new Promise<void>((resolve) => {
					setTimeout(() => resolve(), 20);
				});
				const partialContent = response.slice(0, i);
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === assistantMessage.id
							? { ...msg, content: partialContent }
							: msg,
					),
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const clearMessages = () => {
		setMessages([]);
		setError(null);
	};

	const handleNewChat = () => {
		clearMessages();
		setCurrentChatId(null);
		setError(null);
	};

	const handleChatSelect = (chatId: string) => {
		// In a real app, this would load the chat history from storage/API
		setCurrentChatId(chatId);
		// For now, just clear current messages
		clearMessages();
	};

	return (
		<SidebarProvider
			defaultOpen={true}
			style={
				{
					"--sidebar-width": "20rem",
					"--sidebar-width-mobile": "22rem",
				} as React.CSSProperties
			}
		>
			<div className="flex h-screen w-full">
				<ChatSidebar
					currentChatId={currentChatId ?? undefined}
					onChatSelect={handleChatSelect}
					onNewChat={handleNewChat}
				/>
				<div className="flex-1 flex w-full flex-col">
					<ChatHeader
						selectedModel={selectedModel}
						onModelSelect={handleModelSelect}
					/>
					<main className="flex-1 overflow-hidden">
						<ChatUi
							messages={messages}
							isLoading={isLoading}
							error={error}
							onSendMessage={handleSendMessage}
							onClearMessages={clearMessages}
						/>
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
