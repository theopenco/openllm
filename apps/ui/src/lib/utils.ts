import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a context size number into a human-readable string with k/M suffixes
 * @param contextSize - The context size in tokens
 * @returns Formatted string (e.g., "128k", "1M", "—")
 */
export function formatContextSize(contextSize?: number): string {
	if (!contextSize) {
		return "—";
	}
	if (contextSize >= 1000000) {
		return `${(contextSize / 1000000).toFixed(contextSize % 1000000 === 0 ? 0 : 1)}M`;
	}
	if (contextSize >= 1000) {
		return `${(contextSize / 1000).toFixed(contextSize % 1000 === 0 ? 0 : 1)}k`;
	}
	return contextSize.toString();
}
