import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/lib/components/use-toast";

export interface Chat {
	id: string;
	title: string;
	model: string;
	status: "active" | "archived" | "deleted";
	createdAt: string;
	updatedAt: string;
	messageCount: number;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	sequence: number;
	createdAt: string;
}

const API_BASE = "/api";

// Helper function for authenticated fetch
async function authFetch(url: string, options: RequestInit = {}) {
	const response = await fetch(`${API_BASE}${url}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ message: "Network error" }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return await response.json();
}

export function useChats() {
	return useQuery({
		queryKey: ["chats"],
		queryFn: () => authFetch("/chats"),
	});
}

export function useChat(chatId: string) {
	return useQuery({
		queryKey: ["chats", chatId],
		queryFn: () => authFetch(`/chats/${chatId}`),
		enabled: !!chatId,
	});
}

export function useCreateChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { title: string; model: string }) =>
			authFetch("/chats", {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chats"] });
			toast({ title: "Chat created successfully" });
		},
		onError: (error: Error) => {
			toast({ title: error.message, variant: "destructive" });
		},
	});
}

export function useUpdateChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: { title?: string; status?: "active" | "archived" };
		}) =>
			authFetch(`/chats/${id}`, {
				method: "PATCH",
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chats"] });
			toast({ title: "Chat updated successfully" });
		},
		onError: (error: Error) => {
			toast({ title: error.message, variant: "destructive" });
		},
	});
}

export function useDeleteChat() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (chatId: string) =>
			authFetch(`/chats/${chatId}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chats"] });
			toast({ title: "Chat deleted successfully" });
		},
		onError: (error: Error) => {
			toast({ title: error.message, variant: "destructive" });
		},
	});
}

export function useAddMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			chatId,
			data,
		}: {
			chatId: string;
			data: { role: "user" | "assistant" | "system"; content: string };
		}) =>
			authFetch(`/chats/${chatId}/messages`, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chats"] });
		},
		onError: (error: Error) => {
			toast({ title: error.message, variant: "destructive" });
		},
	});
}
