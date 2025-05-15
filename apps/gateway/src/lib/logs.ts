import { db, log, type InferInsertModel } from "@openllm/db";

/**
 * Insert a log entry into the database.
 * This function is extracted to prepare for future implementation using a message queue.
 */
export type LogInsertData = Omit<
	InferInsertModel<typeof log>,
	"id" | "createdAt" | "updatedAt"
>;

export type LogData = InferInsertModel<typeof log>;

export async function insertLog(logData: LogInsertData): Promise<unknown> {
	return db.insert(log).values({
		createdAt: new Date(),
		updatedAt: new Date(),
		...logData,
	});
}
