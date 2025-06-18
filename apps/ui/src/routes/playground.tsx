import { getModelStreamingSupport } from "@llmgateway/models";
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
import { API_URL } from "@/lib/env";
import { $api } from "@/lib/fetch-client";

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
	const { data: subscriptionStatus, isLoading: isSubscriptionLoading } =
		$api.useQuery("get", "/subscriptions/status", {});
	const { data: orgsData, isLoading: isOrgsLoading } = $api.useQuery(
		"get",
		"/orgs",
	);

	const [showApiKeyManager, setShowApiKeyManager] = useState(false);

	const isAuthenticated = !isUserLoading && !!user;
	const showAuthDialog = !isUserLoading && !user;

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

		if (!isApiKeyLoaded || isSubscriptionLoading || isOrgsLoading) {
			return;
		}

		if (!userApiKey) {
			setShowApiKeyManager(true);
			return;
		}

		// Check if user has pro plan or enough credits
		if (subscriptionStatus?.plan === "pro") {
			// For pro users, check if subscription is expired or cancelled
			if (
				subscriptionStatus.subscriptionCancelled ||
				(subscriptionStatus.planExpiresAt &&
					new Date(subscriptionStatus.planExpiresAt) < new Date())
			) {
				setError(
					"Your pro subscription has expired or been cancelled. Please renew your subscription or purchase credits.",
				);
				return;
			}
		} else if (subscriptionStatus) {
			// only evaluate when the call succeeded
			const org = orgsData?.organizations?.[0];
			const credits = parseFloat(org?.credits ?? "0");
			if (!org || Number.isNaN(credits) || credits <= 0) {
				setError("You don't have enough credits …");
				return;
			}
		} else {
			setError("Unable to verify subscription status. Please retry.");
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
			const response = await fetch(API_URL + "/chat/completion", {
				credentials: "include",
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
				try {
					const errorJson = JSON.parse(errorText);
					if (errorJson.error) {
						setError(errorJson.error);
						throw new Error(errorJson.error);
					}
				} catch {
					// If we can't parse the error as JSON, use the raw error text
					setError(`API Error: ${errorText}`);
					throw new Error(`API Error: ${errorText}`);
				}
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
			const errorMessage =
				err instanceof Error ? err.message : "An unexpected error occurred";
			setError(errorMessage);
			// Add a system message to indicate the error in the chat
			addLocalMessage({
				role: "system",
				content: `Error: ${errorMessage}`,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const clearMessages = () => {
		setMessages([]);
		setError(null);
		setCurrentChatId(null);
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
			<div className="relative flex h-screen w-full flex-col md:flex-row">
				<ChatSidebar
					onNewChat={handleNewChat}
					onChatSelect={handleChatSelect}
					currentChatId={currentChatId ?? undefined}
					userApiKey={userApiKey}
					clearMessages={clearMessages}
					className="w-full md:w-[200px] lg:w-[260px] border-r border-border"
				/>
				<main className="flex flex-1 flex-col min-h-0">
					<ChatHeader
						selectedModel={selectedModel}
						onModelSelect={handleModelSelect}
						onManageApiKey={() => setShowApiKeyManager(true)}
						className="border-b border-border"
					/>
					<ChatUi
						messages={messages}
						isLoading={isLoading}
						onSendMessage={handleSendMessage}
						onClearMessages={clearMessages}
						error={error}
						className="flex-1 overflow-y-auto"
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
