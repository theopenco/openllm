import crypto from "crypto";

import redisClient from "./redis";

export function generateCacheKey(
	model: string,
	messages: any[],
	temperature?: number,
	max_tokens?: number,
	top_p?: number,
	frequency_penalty?: number,
	presence_penalty?: number,
): string {
	const payload = JSON.stringify({
		model,
		messages,
		temperature,
		max_tokens,
		top_p,
		frequency_penalty,
		presence_penalty,
	});

	return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function setCache(
	key: string,
	value: any,
	expirationSeconds: number,
): Promise<void> {
	try {
		await redisClient.set(key, JSON.stringify(value), "EX", expirationSeconds);
	} catch (error) {
		console.error("Error setting cache:", error);
	}
}

export async function getCache(key: string): Promise<any | null> {
	try {
		const cachedValue = await redisClient.get(key);
		if (!cachedValue) {
			return null;
		}
		return JSON.parse(cachedValue);
	} catch (error) {
		console.error("Error getting cache:", error);
		return null;
	}
}

export async function isCachingEnabled(
	projectId: string,
): Promise<{ enabled: boolean; duration: number }> {
	try {
		const configCacheKey = `project_cache_config:${projectId}`;
		const cachedConfig = await redisClient.get(configCacheKey);

		if (cachedConfig) {
			return JSON.parse(cachedConfig);
		}

		const { db } = await import("@openllm/db");
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

		const config = {
			enabled: project.cachingEnabled || false,
			duration: project.cacheDurationSeconds || 60,
		};

		await redisClient.set(configCacheKey, JSON.stringify(config), "EX", 300);

		return config;
	} catch (error) {
		console.error("Error checking if caching is enabled:", error);
		return { enabled: false, duration: 0 };
	}
}
