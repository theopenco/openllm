import { db, tables } from "@openllm/db";

import { processLogQueue } from "../worker";

export async function flushLogs() {
	await processLogQueue();

	await db.delete(tables.log);
}

/**
 * Helper function to wait for logs to be processed by the worker
 * @param expectedCount The expected number of logs
 * @param maxWaitMs Maximum time to wait in milliseconds
 * @param intervalMs Interval between checks in milliseconds
 * @returns Promise that resolves with true if logs are found, false if timed out
 */
export async function waitForLogs(
	expectedCount = 1,
	maxWaitMs = 10000,
	intervalMs = 100,
	requestId?: string,
) {
	const startTime = Date.now();
	console.log(`Waiting for ${expectedCount} logs (timeout: ${maxWaitMs}ms)...`);

	while (Date.now() - startTime < maxWaitMs) {
		await processLogQueue();

		const logs = requestId
			? await db.query.log.findMany({ where: { requestId: { eq: requestId } } })
			: await db.query.log.findMany({});

		if (logs.length >= expectedCount) {
			console.log(
				`Found ${logs.length} logs after ${Date.now() - startTime}ms`,
			);
			return logs;
		}

		// Wait for the next interval
		await new Promise((resolve) => {
			setTimeout(resolve, intervalMs);
		});
	}

	const message = `Timed out waiting for ${expectedCount} logs after ${maxWaitMs}ms`;
	console.warn(message);

	throw new Error(message);
}

export function getProviderEnvVar(provider: string): string | undefined {
	const envMap: Record<string, string> = {
		openai: "OPENAI_API_KEY",
		anthropic: "ANTHROPIC_API_KEY",
		"google-vertex": "VERTEX_API_KEY",
		"google-ai-studio": "GOOGLE_AI_STUDIO_API_KEY",
		"inference.net": "INFERENCE_NET_API_KEY",
		"kluster.ai": "KLUSTER_AI_API_KEY",
		"together.ai": "TOGETHER_AI_API_KEY",
	};
	return process.env[envMap[provider]];
}
