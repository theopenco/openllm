import { models, providers } from "@openllm/models";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import { ApiKeyManager } from "@/components/playground/api-key-manager";
import { AuthDialog } from "@/components/playground/auth-dialog";
import { ChatHeader } from "@/components/playground/chat-header";
import { ChatUi } from "@/components/playground/chat-ui";
import { ChatSidebar } from "@/components/playground/sidebar";
import { useApiKey } from "@/hooks/useApiKey";
import {
	useCreateChat,
	useAddMessage,
	useChat,
	useChats,
} from "@/hooks/useChats";
import { useUser } from "@/hooks/useUser";
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
	const { user, isLoading: isUserLoading } = useUser();
	const { userApiKey, isLoaded: isApiKeyLoaded } = useApiKey();
	const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");

	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentChatId, setCurrentChatId] = useState<string | null>(null);

	// Chat API hooks
	const createChat = useCreateChat();
	const addMessage = useAddMessage();
	const { data: currentChatData, isLoading: _isChatLoading } = useChat(
		currentChatId || "",
	);
	const { data: _chatsData } = useChats();

	const [showApiKeyManager, setShowApiKeyManager] = useState(false);

	const isAuthenticated = !isUserLoading && !!user;
	const showAuthDialog = !isUserLoading && !user;

	// Check if the selected model supports streaming
	const getModelStreamingSupport = (modelName: string) => {
		const modelInfo = models.find((m) => m.model === modelName);
		if (!modelInfo) {
			return false;
		}

		// Check if any provider for this model supports streaming
		return modelInfo.providers.some((provider) => {
			const providerInfo = providers.find((p) => p.id === provider.providerId);
			return providerInfo?.streaming === true;
		});
	};

	useEffect(() => {
		if (isApiKeyLoaded && !userApiKey && !showAuthDialog) {
			setShowApiKeyManager(true);
		}
	}, [isApiKeyLoaded, userApiKey, showAuthDialog]);

	useEffect(() => {
		if (currentChatData?.messages) {
			const chatMessages: Message[] = currentChatData.messages.map(
				(msg: any) => ({
					id: msg.id,
					role: msg.role,
					content: msg.content,
					timestamp: new Date(msg.createdAt),
				}),
			);
			setMessages(chatMessages);
		}
	}, [currentChatData]);

	const handleModelSelect = (model: string) => {
		setSelectedModel(model);
	};

	const addLocalMessage = (message: Omit<Message, "id" | "timestamp">) => {
		const newMessage: Message = {
			...message,
			id: Date.now().toString(),
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, newMessage]);
		return newMessage;
	};

	const ensureCurrentChat = async (userMessage?: string): Promise<string> => {
		if (currentChatId) {
			return currentChatId;
		}

		try {
			const title = userMessage
				? userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "")
				: "New Chat";

			const chatData = await createChat.mutateAsync({
				title,
				model: selectedModel,
			});
			const newChatId = chatData.chat.id;
			setCurrentChatId(newChatId);
			return newChatId;
		} catch (error: any) {
			console.error("Failed to create chat:", error);
			setError("Failed to create a new chat. Please try again.");
			throw error;
		}
	};

	const handleSendMessage = async (content: string) => {
		if (!isAuthenticated || !content.trim()) {
			return;
		}

		if (!isApiKeyLoaded) {
			return;
		}

		if (!userApiKey) {
			setShowApiKeyManager(true);
			return;
		}

		setIsLoading(true);
		addLocalMessage({ role: "user", content });

		try {
			const chatId = await ensureCurrentChat(content);

			await addMessage.mutateAsync({
				chatId,
				data: { role: "user", content },
			});

			const supportsStreaming = getModelStreamingSupport(selectedModel);
			const response = await fetch("/api/chat/completion", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: selectedModel,
					messages: [...messages, { role: "user", content }].map((msg) => ({
						role: msg.role,
						content: msg.content,
					})),
					stream: supportsStreaming,
					apiKey: userApiKey,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				setError(`API Error: ${errorText}`);
				throw new Error(`API Error: ${response.status} ${response.statusText}`);
			}

			if (supportsStreaming) {
				// Handle streaming response
				const reader = response.body?.getReader();
				if (!reader) {
					throw new Error("No response body");
				}

				const assistantMessage = addLocalMessage({
					role: "assistant",
					content: "",
				});
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
								} catch (e) {
									console.error("Error parsing stream data:", e);
								}
							}
						}
					}

					if (assistantContent.trim()) {
						await addMessage.mutateAsync({
							chatId,
							data: { role: "assistant", content: assistantContent },
						});
					}
				} finally {
					reader.releaseLock();
				}
			} else {
				// Handle non-streaming response
				const responseData = await response.json();
				const assistantContent =
					responseData.choices?.[0]?.message?.content || "";

				if (assistantContent.trim()) {
					addLocalMessage({
						role: "assistant",
						content: assistantContent,
					});

					await addMessage.mutateAsync({
						chatId,
						data: { role: "assistant", content: assistantContent },
					});
				}
			}
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	const clearMessages = () => {
		setMessages([]);
		setError(null);
	};

	const handleNewChat = async () => {
		if (!userApiKey) {
			setShowApiKeyManager(true);
			return;
		}
		setError(null);
		setCurrentChatId(null);
		setMessages([]);
	};

	const handleChatSelect = (chatId: string) => {
		setCurrentChatId(chatId);
	};

	return (
		<SidebarProvider>
			<div className="relative flex h-screen w-full">
				<ChatSidebar
					onNewChat={handleNewChat}
					onChatSelect={handleChatSelect}
					currentChatId={currentChatId ?? undefined}
					userApiKey={userApiKey}
				/>
				<main className="flex flex-1 flex-col">
					<ChatHeader
						selectedModel={selectedModel}
						onModelSelect={handleModelSelect}
						onManageApiKey={() => setShowApiKeyManager(true)}
					/>
					<ChatUi
						messages={messages}
						isLoading={isLoading}
						onSendMessage={handleSendMessage}
						onClearMessages={clearMessages}
						error={error}
					/>
				</main>
			</div>
			<AuthDialog open={showAuthDialog} />
			<ApiKeyManager
				open={showApiKeyManager}
				onOpenChange={setShowApiKeyManager}
			/>
		</SidebarProvider>
	);
}
