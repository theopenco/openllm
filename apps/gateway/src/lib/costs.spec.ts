import { describe, expect, it } from "vitest";

import { calculateCosts } from "./costs";

describe("calculateCosts", () => {
	it("should calculate costs with provided token counts", () => {
		const result = calculateCosts("gpt-4", 100, 50);

		expect(result.inputCost).toBeCloseTo(0.001); // 100 * 0.00001
		expect(result.outputCost).toBeCloseTo(0.0015); // 50 * 0.00003
		expect(result.totalCost).toBeCloseTo(0.0025); // 0.001 + 0.0015
		expect(result.promptTokens).toBe(100);
		expect(result.completionTokens).toBe(50);
	});

	it("should calculate costs with null token counts but provided text", () => {
		const result = calculateCosts("gpt-4", null, null, {
			prompt: "Hello, how are you?",
			completion: "I'm doing well, thank you for asking!",
		});

		// The exact token counts will depend on the tokenizer, but we can check that they're calculated
		expect(result.promptTokens).toBeGreaterThan(0);
		expect(result.completionTokens).toBeGreaterThan(0);
		expect(result.inputCost).toBeGreaterThan(0);
		expect(result.outputCost).toBeGreaterThan(0);
		expect(result.totalCost).toBeGreaterThan(0);
	});

	it("should calculate costs with null token counts but provided chat messages", () => {
		const result = calculateCosts("gpt-4", null, null, {
			messages: [
				{ role: "user", content: "Hello, how are you?" },
				{ role: "assistant", content: "I'm doing well, thank you for asking!" },
			],
			completion: "I'm doing well, thank you for asking!",
		});

		// The exact token counts will depend on the tokenizer, but we can check that they're calculated
		expect(result.promptTokens).toBeGreaterThan(0);
		expect(result.completionTokens).toBeGreaterThan(0);
		expect(result.inputCost).toBeGreaterThan(0);
		expect(result.outputCost).toBeGreaterThan(0);
		expect(result.totalCost).toBeGreaterThan(0);
	});

	it("should return null costs when model info is not found", () => {
		// @ts-expect-error - Testing with invalid model
		const result = calculateCosts("non-existent-model", 100, 50);

		expect(result.inputCost).toBeNull();
		expect(result.outputCost).toBeNull();
		expect(result.totalCost).toBeNull();
		expect(result.promptTokens).toBe(100);
		expect(result.completionTokens).toBe(50);
	});

	it("should return null costs when token counts are null and no text is provided", () => {
		const result = calculateCosts("gpt-4", null, null);

		expect(result.inputCost).toBeNull();
		expect(result.outputCost).toBeNull();
		expect(result.totalCost).toBeNull();
		expect(result.promptTokens).toBeNull();
		expect(result.completionTokens).toBeNull();
	});
});
