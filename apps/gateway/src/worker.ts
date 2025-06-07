import {
	db,
	log,
	organization,
	paymentMethod,
	eq,
	sql,
	and,
	lt,
	tables,
} from "@openllm/db";

import { getProject, getOrganization } from "./lib/cache";
import { consumeFromQueue, LOG_QUEUE } from "./lib/redis";
import { stripe } from "../../api/src/routes/payments";

import type { LogInsertData } from "./lib/logs";

const SERVICE_FEE_MULTIPLIER = 1.05;
const AUTO_TOPUP_LOCK_KEY = "auto_topup_check";
const LOCK_DURATION_MINUTES = 10;

async function acquireLock(key: string): Promise<boolean> {
	const lockExpiry = new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000);

	try {
		await db
			.delete(tables.lock)
			.where(
				and(eq(tables.lock.key, key), lt(tables.lock.updatedAt, lockExpiry)),
			);

		await db.insert(tables.lock).values({
			key,
		});

		return true;
	} catch (_error) {
		return false;
	}
}

async function releaseLock(key: string): Promise<void> {
	await db.delete(tables.lock).where(eq(tables.lock.key, key));
}

async function processAutoTopUp(): Promise<void> {
	const lockAcquired = await acquireLock(AUTO_TOPUP_LOCK_KEY);
	if (!lockAcquired) {
		return;
	}

	try {
		const orgsNeedingTopUp = await db
			.select()
			.from(organization)
			.where(
				and(
					eq(organization.autoTopUpEnabled, true),
					sql`CAST(${organization.credits} AS DECIMAL) < CAST(${organization.autoTopUpThreshold} AS DECIMAL)`,
				),
			);

		for (const org of orgsNeedingTopUp) {
			try {
				const defaultPaymentMethod = await db
					.select()
					.from(paymentMethod)
					.where(
						and(
							eq(paymentMethod.organizationId, org.id),
							eq(paymentMethod.isDefault, true),
						),
					)
					.limit(1)
					.then((rows) => rows[0]);

				if (!defaultPaymentMethod) {
					console.log(
						`No default payment method for organization ${org.id}, skipping auto top-up`,
					);
					continue;
				}

				const topUpAmount = Number(org.autoTopUpAmount || "10");

				const paymentIntent = await stripe.paymentIntents.create({
					amount: topUpAmount * 100,
					currency: "usd",
					description: `Auto top-up for ${topUpAmount} USD`,
					payment_method: defaultPaymentMethod.stripePaymentMethodId,
					customer: org.stripeCustomerId!,
					confirm: true,
					off_session: true,
					metadata: {
						organizationId: org.id,
						autoTopUp: "true",
					},
				});

				if (paymentIntent.status === "succeeded") {
					console.log(
						`Auto top-up successful for organization ${org.id}: $${topUpAmount}`,
					);
				} else {
					console.error(
						`Auto top-up failed for organization ${org.id}: ${paymentIntent.status}`,
					);
				}
			} catch (error) {
				console.error(
					`Error processing auto top-up for organization ${org.id}:`,
					error,
				);
			}
		}
	} finally {
		await releaseLock(AUTO_TOPUP_LOCK_KEY);
	}
}

export async function processLogQueue(): Promise<void> {
	const message = await consumeFromQueue(LOG_QUEUE);

	if (!message) {
		return;
	}

	try {
		const logData = message.map((i) => JSON.parse(i) as LogInsertData);

		const processedLogData = await Promise.all(
			logData.map(async (data) => {
				const organization = await getOrganization(data.organizationId);

				if (organization?.retentionLevel === "none") {
					const {
						messages: _messages,
						content: _content,
						...metadataOnly
					} = data;
					return metadataOnly;
				}

				return data;
			}),
		);

		await db.insert(log).values(processedLogData as any);

		for (const data of logData) {
			if (!data.cost || data.cached) {
				continue;
			}

			const project = await getProject(data.projectId);

			if (project?.mode !== "api-keys") {
				const costWithServiceFee = data.cost * SERVICE_FEE_MULTIPLIER;
				await db
					.update(organization)
					.set({
						credits: sql`${organization.credits} - ${costWithServiceFee}`,
					})
					.where(eq(organization.id, data.organizationId));
			}
		}
	} catch (error) {
		console.error("Error processing log message:", error);
	}
}

export async function startWorker() {
	console.log("Starting log queue worker...");
	let autoTopUpCounter = 0;

	while (true) {
		try {
			await processLogQueue();

			autoTopUpCounter++;
			if (autoTopUpCounter >= 60) {
				await processAutoTopUp();
				autoTopUpCounter = 0;
			}

			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});
		} catch (error) {
			console.error("Error starting log queue worker:", error);
		}
	}
}

void startWorker();
