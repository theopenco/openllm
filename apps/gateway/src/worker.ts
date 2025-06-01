import { db, log, organization, eq, sql, tables } from "@openllm/db";

import { getProject } from "./lib/cache";
import { consumeFromQueue, LOG_QUEUE } from "./lib/redis";

import type { LogInsertData } from "./lib/logs";

const SERVICE_FEE_MULTIPLIER = 1.05;

async function checkAndTriggerAutoTopUp(organizationId: string): Promise<void> {
	try {
		const org = await db.query.organization.findFirst({
			where: {
				id: {
					eq: organizationId,
				},
			},
		});

		if (!org || !org.autoTopUpEnabled) {
			return;
		}

		const currentCredits = parseFloat(org.credits);
		const threshold = parseFloat(org.autoTopUpThreshold || "10.00");

		if (currentCredits > threshold) {
			return;
		}

		const now = new Date();
		const lastTriggered = org.autoTopUpLastTriggered;

		if (lastTriggered) {
			const timeSinceLastTrigger = now.getTime() - lastTriggered.getTime();
			const oneHourInMs = 60 * 60 * 1000;

			if (timeSinceLastTrigger < oneHourInMs) {
				return;
			}
		}

		const defaultPaymentMethod = await db.query.paymentMethod.findFirst({
			where: {
				organizationId: {
					eq: organizationId,
				},
				isDefault: {
					eq: true,
				},
			},
		});

		if (!defaultPaymentMethod) {
			console.log(
				`No default payment method found for organization ${organizationId}`,
			);
			return;
		}

		const topUpAmount = parseFloat(org.autoTopUpAmount || "10.00");
		const amountInCents = Math.round(topUpAmount * 100);

		const Stripe = (await import("stripe")).default;
		const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "");

		const paymentIntent = await stripeClient.paymentIntents.create({
			amount: amountInCents,
			currency: "usd",
			payment_method: defaultPaymentMethod.stripePaymentMethodId,
			customer: org.stripeCustomerId,
			confirm: true,
			return_url: process.env.UI_URL || "http://localhost:3002",
			metadata: {
				organizationId,
				autoTopUp: "true",
			},
		});

		if (paymentIntent.status === "succeeded") {
			await db
				.update(tables.organization)
				.set({
					credits: sql`${organization.credits} + ${topUpAmount}`,
					autoTopUpLastTriggered: now,
					updatedAt: new Date(),
				})
				.where(eq(tables.organization.id, organizationId));

			await db.insert(tables.organizationAction).values({
				organizationId,
				type: "credit",
				amount: topUpAmount.toString(),
				description: "Auto top-up via Stripe",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			console.log(
				`Auto top-up successful: Added ${topUpAmount} credits to organization ${organizationId}`,
			);
		} else {
			console.error(
				`Auto top-up failed for organization ${organizationId}: Payment intent status ${paymentIntent.status}`,
			);
		}
	} catch (error) {
		console.error(
			`Error during auto top-up for organization ${organizationId}:`,
			error,
		);
	}
}

export async function processLogQueue(): Promise<void> {
	const message = await consumeFromQueue(LOG_QUEUE);

	if (!message) {
		return;
	}

	try {
		const logData = message.map((i) => JSON.parse(i) as LogInsertData);

		await db.insert(log).values(
			logData.map((i) => ({
				createdAt: new Date(),
				...i,
			})),
		);

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

				await checkAndTriggerAutoTopUp(data.organizationId);
			}
		}
	} catch (error) {
		console.error("Error processing log message:", error);
	}
}

export async function startWorker() {
	console.log("Starting log queue worker...");
	while (true) {
		try {
			await processLogQueue();
			await new Promise((resolve) => {
				setTimeout(resolve, 1000);
			});
		} catch (error) {
			console.error("Error starting log queue worker:", error);
		}
	}
}

void startWorker();
