import { db } from "@openllm/db";

/**
 * Helper function to wait for logs to be processed by the worker
 * @param expectedCount The expected number of logs
 * @param maxWaitMs Maximum time to wait in milliseconds
 * @param intervalMs Interval between checks in milliseconds
 * @param shouldThrow Whether to throw an error on timeout (default: true)
 * @returns Promise that resolves with true if logs are found, false if timed out
 */
export async function waitForLogs(
	expectedCount = 1,
	maxWaitMs = 10000, // Increased default timeout to 10 seconds
	intervalMs = 100,
	shouldThrow = true,
): Promise<boolean> {
	const startTime = Date.now();
	console.log(`Waiting for ${expectedCount} logs (timeout: ${maxWaitMs}ms)...`);

	while (Date.now() - startTime < maxWaitMs) {
		const logs = await db.query.log.findMany({});

		if (logs.length >= expectedCount) {
			console.log(
				`Found ${logs.length} logs after ${Date.now() - startTime}ms`,
			);
			return true;
		}

		// Wait for the next interval
		await new Promise((resolve) => {
			setTimeout(resolve, intervalMs);
		});
	}

	const message = `Timed out waiting for ${expectedCount} logs after ${maxWaitMs}ms`;
	console.warn(message);

	if (shouldThrow) {
		throw new Error(message);
	}

	return false;
}
