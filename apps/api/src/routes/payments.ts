import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { db, eq, tables, sql } from "@openllm/db";
import { HTTPException } from "hono/http-exception";
import Stripe from "stripe";
import { z } from "zod";

import { ensureStripeCustomer } from "../stripe";

import type { ServerTypes } from "../vars";

export const stripe = new Stripe(
	process.env.STRIPE_SECRET_KEY || "sk_test_123",
	{
		apiVersion: "2025-04-30.basil",
	},
);

export const payments = new OpenAPIHono<ServerTypes>();

const chargeDefaultPaymentMethod = createRoute({
	method: "post",
	path: "/charge-default",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						organizationId: z.string(),
						amount: z.number().min(0.01),
						description: z.string().optional(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						error: z.string().optional(),
					}),
				},
			},
			description: "Charge default payment method result",
		},
	},
});

payments.openapi(chargeDefaultPaymentMethod, async (c) => {
	try {
		const { organizationId, amount, description } = await c.req.json();

		const organization = await db.query.organization.findFirst({
			where: {
				id: {
					eq: organizationId,
				},
			},
		});

		if (!organization) {
			return c.json({ success: false, error: "Organization not found" }, 404);
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
			return c.json(
				{ success: false, error: "No default payment method found" },
				400,
			);
		}

		const amountInCents = Math.round(amount * 100);

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amountInCents,
			currency: "usd",
			payment_method: defaultPaymentMethod.stripePaymentMethodId,
			customer: organization.stripeCustomerId || undefined,
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
					credits: sql`${tables.organization.credits} + ${amount}`,
					updatedAt: new Date(),
				})
				.where(eq(tables.organization.id, organizationId));

			await db.insert(tables.organizationAction).values({
				organizationId,
				type: "credit",
				amount: amount.toString(),
				description: description || "Auto top-up via Stripe",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return c.json({ success: true });
		} else {
			return c.json({
				success: false,
				error: `Payment failed with status: ${paymentIntent.status}`,
			});
		}
	} catch (error) {
		console.error("Error charging default payment method:", error);
		return c.json({ success: false, error: "Internal server error" }, 500);
	}
});

const createPaymentIntent = createRoute({
	method: "post",
	path: "/create-payment-intent",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						amount: z.number().int().min(5),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						clientSecret: z.string(),
					}),
				},
			},
			description: "Payment intent created successfully",
		},
	},
});

payments.openapi(createPaymentIntent, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { amount } = c.req.valid("json");

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	const organizationId = userOrganization.organization.id;

	try {
		const stripeCustomerId = await ensureStripeCustomer(organizationId);

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount * 100, // Convert to cents
			currency: "usd",
			description: `Credit purchase for ${amount} USD`,
			customer: stripeCustomerId,
			metadata: {
				organizationId,
			},
		});

		return c.json({
			clientSecret: paymentIntent.client_secret || "",
		});
	} catch (error) {
		console.error("Stripe error:", error);
		throw new HTTPException(500, {
			message: "Failed to create payment intent",
		});
	}
});

const createSetupIntent = createRoute({
	method: "post",
	path: "/create-setup-intent",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						clientSecret: z.string(),
					}),
				},
			},
			description: "Setup intent created successfully",
		},
	},
});

payments.openapi(createSetupIntent, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	const organizationId = userOrganization.organization.id;

	try {
		const setupIntent = await stripe.setupIntents.create({
			usage: "off_session",
			metadata: {
				organizationId,
			},
		});

		return c.json({
			clientSecret: setupIntent.client_secret || "",
		});
	} catch (error) {
		console.error("Stripe error:", error);
		throw new HTTPException(500, {
			message: "Failed to create setup intent",
		});
	}
});

const getPaymentMethods = createRoute({
	method: "get",
	path: "/payment-methods",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						paymentMethods: z.array(
							z.object({
								id: z.string(),
								stripePaymentMethodId: z.string(),
								type: z.string(),
								isDefault: z.boolean(),
								cardBrand: z.string().optional(),
								cardLast4: z.string().optional(),
								expiryMonth: z.number().optional(),
								expiryYear: z.number().optional(),
							}),
						),
					}),
				},
			},
			description: "Payment methods retrieved successfully",
		},
	},
});

payments.openapi(getPaymentMethods, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	const organizationId = userOrganization.organization.id;

	try {
		const paymentMethods = await db.query.paymentMethod.findMany({
			where: {
				organizationId,
			},
		});

		const enhancedPaymentMethods = await Promise.all(
			paymentMethods.map(async (pm) => {
				const stripePaymentMethod = await stripe.paymentMethods.retrieve(
					pm.stripePaymentMethodId,
				);

				let cardDetails = {};
				if (stripePaymentMethod.type === "card" && stripePaymentMethod.card) {
					cardDetails = {
						cardBrand: stripePaymentMethod.card.brand,
						cardLast4: stripePaymentMethod.card.last4,
						expiryMonth: stripePaymentMethod.card.exp_month,
						expiryYear: stripePaymentMethod.card.exp_year,
					};
				}

				return {
					...pm,
					...cardDetails,
				};
			}),
		);

		return c.json({
			paymentMethods: enhancedPaymentMethods,
		});
	} catch (error) {
		console.error("Error fetching payment methods:", error);
		throw new HTTPException(500, {
			message: "Failed to fetch payment methods",
		});
	}
});

const setDefaultPaymentMethod = createRoute({
	method: "post",
	path: "/payment-methods/default",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						paymentMethodId: z.string(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
			description: "Default payment method set successfully",
		},
	},
});

payments.openapi(setDefaultPaymentMethod, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { paymentMethodId } = c.req.valid("json");

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	const organizationId = userOrganization.organization.id;

	const paymentMethod = await db.query.paymentMethod.findFirst({
		where: {
			id: paymentMethodId,
			organizationId,
		},
	});

	if (!paymentMethod) {
		throw new HTTPException(404, {
			message: "Payment method not found",
		});
	}

	try {
		await db
			.update(tables.paymentMethod)
			.set({
				isDefault: false,
				updatedAt: new Date(),
			})
			.where(eq(tables.paymentMethod.organizationId, organizationId));

		await db
			.update(tables.paymentMethod)
			.set({
				isDefault: true,
				updatedAt: new Date(),
			})
			.where(eq(tables.paymentMethod.id, paymentMethodId));

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Error setting default payment method:", error);
		throw new HTTPException(500, {
			message: "Failed to set default payment method",
		});
	}
});

const deletePaymentMethod = createRoute({
	method: "delete",
	path: "/payment-methods/{id}",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
			description: "Payment method deleted successfully",
		},
	},
});

payments.openapi(deletePaymentMethod, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (!userOrganization || !userOrganization.organization) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	const organizationId = userOrganization.organization.id;

	const paymentMethod = await db.query.paymentMethod.findFirst({
		where: {
			id,
			organizationId,
		},
	});

	if (!paymentMethod) {
		throw new HTTPException(404, {
			message: "Payment method not found",
		});
	}

	try {
		await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);

		await db
			.delete(tables.paymentMethod)
			.where(eq(tables.paymentMethod.id, id));

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Error deleting payment method:", error);
		throw new HTTPException(500, {
			message: "Failed to delete payment method",
		});
	}
});

const topUpWithSavedMethod = createRoute({
	method: "post",
	path: "/top-up-with-saved-method",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						amount: z.number().int().min(5),
						paymentMethodId: z.string(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
			description: "Payment processed successfully",
		},
	},
});

payments.openapi(topUpWithSavedMethod, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { amount, paymentMethodId } = c.req.valid("json");

	const paymentMethod = await db.query.paymentMethod.findFirst({
		where: {
			id: paymentMethodId,
		},
	});

	if (!paymentMethod) {
		throw new HTTPException(404, {
			message: "Payment method not found",
		});
	}

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	if (
		!userOrganization ||
		!userOrganization.organization ||
		userOrganization.organization.id !== paymentMethod.organizationId
	) {
		throw new HTTPException(403, {
			message: "Unauthorized access to payment method",
		});
	}

	try {
		const stripeCustomerId = userOrganization.organization.stripeCustomerId;

		if (!stripeCustomerId) {
			throw new HTTPException(400, {
				message: "No Stripe customer ID found for this organization",
			});
		}

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount * 100, // Convert to cents
			currency: "usd",
			description: `Credit purchase for ${amount} USD`,
			payment_method: paymentMethod.stripePaymentMethodId,
			customer: stripeCustomerId,
			confirm: true,
			off_session: true,
			metadata: {
				organizationId: userOrganization.organization.id,
			},
		});

		if (paymentIntent.status !== "succeeded") {
			throw new HTTPException(400, {
				message: `Payment failed: ${paymentIntent.status}`,
			});
		}

		return c.json({
			success: true,
		});
	} catch (error) {
		console.error("Stripe error:", error);
		throw new HTTPException(500, {
			message: "Failed to process payment",
		});
	}
});
