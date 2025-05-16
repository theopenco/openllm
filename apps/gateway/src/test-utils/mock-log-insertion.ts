import { db, log } from "@openllm/db";
import { vi } from "vitest";

import * as redis from "../lib/redis";

import type { LogInsertData } from "../lib/logs";

/**
 * Mock the Redis queue functions to directly insert logs into the database
 * instead of using the Redis queue during tests
 */
export function mockLogInsertion(): void {
	// Use vi.spyOn to mock the publishToQueue function
	vi.spyOn(redis, "publishToQueue").mockImplementation(
		async (queue: string, data: any) => {
			// Only intercept log queue messages
			if (queue === redis.LOG_QUEUE) {
				try {
					const logData = data as LogInsertData;
					// Insert directly into the database
					await db.insert(log).values({
						createdAt: new Date(),
						updatedAt: new Date(),
						...logData,
					});
					console.log("Log inserted directly into database (mocked)");
					return;
				} catch (error) {
					console.error("Error inserting log directly:", error);
					throw error;
				}
			}
		},
	);
}
