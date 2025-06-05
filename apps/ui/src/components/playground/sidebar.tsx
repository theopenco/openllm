import { format } from "date-fns";
import { Plus, MessageSquare, Edit2, Trash2, Settings } from "lucide-react";
import { useState } from "react";

import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/lib/components/sidebar";

interface ChatSession {
	id: string;
	title: string;
	createdAt: Date;
	updatedAt: Date;
	messageCount: number;
}

interface ChatSidebarProps {
	currentChatId?: string;
	onChatSelect?: (chatId: string) => void;
	onNewChat?: () => void;
}

export function ChatSidebar({
	currentChatId,
	onChatSelect,
	onNewChat,
}: ChatSidebarProps) {
	// Mock chat sessions for now - this would come from state management/API later
	const [chats, setChats] = useState<ChatSession[]>([
		{
			id: "1",
			title: "Getting started with OpenLLM",
			createdAt: new Date(Date.now() - 86400000), // 1 day ago
			updatedAt: new Date(Date.now() - 86400000),
			messageCount: 8,
		},
		{
			id: "2",
			title: "Model comparison discussion",
			createdAt: new Date(Date.now() - 3600000), // 1 hour ago
			updatedAt: new Date(Date.now() - 3600000),
			messageCount: 12,
		},
		{
			id: "3",
			title: "Code review assistance",
			createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
			updatedAt: new Date(Date.now() - 1800000),
			messageCount: 5,
		},
	]);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState("");

	const handleEditTitle = (chat: ChatSession) => {
		setEditingId(chat.id);
		setEditTitle(chat.title);
	};

	const saveTitle = (chatId: string) => {
		if (editTitle.trim()) {
			setChats((prev) =>
				prev.map((chat) =>
					chat.id === chatId
						? { ...chat, title: editTitle.trim(), updatedAt: new Date() }
						: chat,
				),
			);
		}
		setEditingId(null);
		setEditTitle("");
	};

	const deleteChat = (chatId: string) => {
		setChats((prev) => prev.filter((chat) => chat.id !== chatId));
		// If deleting current chat, trigger new chat
		if (currentChatId === chatId) {
			onNewChat?.();
		}
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 1) {
			return "Just now";
		} else if (diffInHours < 24) {
			return `${Math.floor(diffInHours)}h ago`;
		} else if (diffInHours < 48) {
			return "Yesterday";
		} else {
			return format(date, "MMM d");
		}
	};

	const groupChatsByDate = (chats: ChatSession[]) => {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const lastWeek = new Date(today);
		lastWeek.setDate(lastWeek.getDate() - 7);

		const groups = {
			today: [] as ChatSession[],
			yesterday: [] as ChatSession[],
			lastWeek: [] as ChatSession[],
			older: [] as ChatSession[],
		};

		chats.forEach((chat) => {
			const chatDate = new Date(chat.updatedAt);
			if (chatDate.toDateString() === today.toDateString()) {
				groups.today.push(chat);
			} else if (chatDate.toDateString() === yesterday.toDateString()) {
				groups.yesterday.push(chat);
			} else if (chatDate >= lastWeek) {
				groups.lastWeek.push(chat);
			} else {
				groups.older.push(chat);
			}
		});

		return groups;
	};

	const chatGroups = groupChatsByDate(
		[...chats].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
	);

	const renderChatGroup = (title: string, chats: ChatSession[]) => {
		if (chats.length === 0) {
			return null;
		}

		return (
			<div key={title} className="mb-4">
				<div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
					{title}
				</div>
				<div className="space-y-1">
					{chats.map((chat) => (
						<SidebarMenuItem key={chat.id}>
							<SidebarMenuButton
								isActive={currentChatId === chat.id}
								onClick={() => onChatSelect?.(chat.id)}
								className="w-full justify-start gap-2 group relative pr-8"
							>
								<MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
								{editingId === chat.id ? (
									<Input
										value={editTitle}
										onChange={(e) => setEditTitle(e.target.value)}
										onBlur={() => saveTitle(chat.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												saveTitle(chat.id);
											}
											if (e.key === "Escape") {
												setEditingId(null);
												setEditTitle("");
											}
										}}
										className="h-6 text-sm border-none p-0 focus-visible:ring-0 bg-transparent"
										autoFocus
									/>
								) : (
									<div className="flex-1 min-w-0">
										<div className="truncate text-sm font-medium">
											{chat.title}
										</div>
										<div className="text-xs text-muted-foreground">
											{chat.messageCount} messages •{" "}
											{formatDate(chat.updatedAt)}
										</div>
									</div>
								)}

								{/* Action buttons */}
								{currentChatId === chat.id && editingId !== chat.id && (
									<div className="absolute right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background">
										<SidebarMenuAction
											onClick={(e) => {
												e.stopPropagation();
												handleEditTitle(chat);
											}}
											className="h-6 w-6"
										>
											<Edit2 className="h-3 w-3" />
										</SidebarMenuAction>
										<SidebarMenuAction
											onClick={(e) => {
												e.stopPropagation();
												deleteChat(chat.id);
											}}
											className="h-6 w-6 text-destructive hover:text-destructive"
										>
											<Trash2 className="h-3 w-3" />
										</SidebarMenuAction>
									</div>
								)}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</div>
			</div>
		);
	};

	return (
		<Sidebar className="border-r w-80">
			<SidebarHeader className="p-4 border-b">
				<Button
					onClick={onNewChat}
					className="w-full justify-start gap-2 bg-primary hover:bg-primary/90"
				>
					<Plus className="h-4 w-4" />
					New Chat
				</Button>
			</SidebarHeader>

			<SidebarContent className="px-2 py-4">
				<SidebarMenu>
					{renderChatGroup("Today", chatGroups.today)}
					{renderChatGroup("Yesterday", chatGroups.yesterday)}
					{renderChatGroup("Last 7 days", chatGroups.lastWeek)}
					{renderChatGroup("Older", chatGroups.older)}

					{chats.length === 0 && (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
							<p className="text-sm text-muted-foreground mb-2">
								No chat history
							</p>
							<p className="text-xs text-muted-foreground">
								Start a new conversation to see it here
							</p>
						</div>
					)}
				</SidebarMenu>
			</SidebarContent>

			<SidebarFooter className="p-4 border-t">
				<Button
					variant="ghost"
					className="w-full justify-start gap-2 text-muted-foreground"
				>
					<Settings className="h-4 w-4" />
					Settings
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}
