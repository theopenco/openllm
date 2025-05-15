import { db } from "@openllm/db";
import NodeCache from "node-cache";

const cache = new NodeCache({
	stdTTL: 3600, // Default TTL is 1 hour
	checkperiod: 120, // Check for expired keys every 2 minutes
});

/**
 * Generate a cache key from request parameters
 */
export function generateCacheKey(
	projectId: string,
	model: string,
	messages: any[],
	temperature?: number,
	max_tokens?: number,
	top_p?: number,
	frequency_penalty?: number,
	presence_penalty?: number,
): string {
	const requestData = {
		projectId,
		model,
		messages,
		temperature,
		max_tokens,
		top_p,
		frequency_penalty,
		presence_penalty,
	};

	return JSON.stringify(requestData);
}

/**
 * Check if caching is enabled for a project and get the cache duration
 */
export async function getProjectCacheSettings(
	projectId: string,
): Promise<{ enabled: boolean; duration: number }> {
	const project = await db.query.project.findFirst({
		where: {
			id: {
				eq: projectId,
			},
		},
	});

	if (!project) {
		return { enabled: false, duration: 0 };
	}

	return {
		enabled: project.cacheEnabled || false,
		duration: project.cacheDuration || 3600, // Default to 1 hour if not set
	};
}

/**
 * Get a value from the cache
 */
export function getCachedResponse(key: string): any {
	return cache.get(key);
}

/**
 * Store a value in the cache with the specified TTL
 */
export function setCachedResponse(key: string, value: any, ttl: number): void {
	cache.set(key, value, ttl);
}

/**
 * Clear all cached items
 */
export function clearCache(): void {
	cache.flushAll();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
	hits: number;
	misses: number;
	keys: number;
} {
	const stats = cache.getStats();
	return {
		hits: stats.hits,
		misses: stats.misses,
		keys: cache.keys().length,
	};
}
