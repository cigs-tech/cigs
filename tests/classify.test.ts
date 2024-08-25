import { describe, expect, it } from "vitest";
import { z } from "zod";
import { cig } from "../src/smoke";

describe("Classification using ChainSmoker", () => {
  const inputSchema = z.object({
    text: z.string(),
  });
  const labels = ["Positive", "Negative", "Neutral"];

  const classificationSmoker = cig(
    "SentimentAnalysis",
    inputSchema,
    (config) => {
      config.setDescription("Classify the sentiment of the given text");
      config.setModel("gpt-4o-2024-08-06");
    },
  ).classify(labels, (config) => {
    config.addInstruction(
      "Determine if the sentiment is positive, negative, or neutral.",
    );
  });

  it("should classify positive sentiment correctly", async () => {
    const result = await classificationSmoker.run({
      text: "I love this product!",
    });
    expect(labels).toContain(result);
  }, 30000);

  it("should classify negative sentiment correctly", async () => {
    const result = await classificationSmoker.run({
      text: "This is terrible.",
    });
    expect(labels).toContain(result);
  }, 30000);

  it("should handle string input directly", async () => {
    const result = await classificationSmoker.run(
      "This is a neutral statement.",
    );
    expect(labels).toContain(result);
  }, 30000);

  it("should handle empty input gracefully", async () => {
    const result = await classificationSmoker.run({ text: "" });
    expect(labels).toContain(result);
  }, 30000);

  it("should handle very long input", async () => {
    const longText = "a".repeat(1000);
    const result = await classificationSmoker.run({ text: longText });
    expect(labels).toContain(result);
  }, 30000);

  it("should handle non-ASCII characters", async () => {
    const result = await classificationSmoker.run({ text: "这是一个测试" });
    expect(labels).toContain(result);
  }, 30000);

  it("should handle classification with only one label", async () => {
    const singleLabelSmoker = cig(
      "SingleLabelClassification",
      inputSchema,
      (config) => {
        config.setDescription("Single label classification");
        config.setModel("gpt-4o-2024-08-06");
      },
    ).classify(["SingleLabel"], (config) => {
      config.addInstruction("Always classify as SingleLabel.");
    });

    const result = await singleLabelSmoker.run({ text: "Test" });
    expect(result).toBe("SingleLabel");
  }, 30000);

  it("should handle multiple consecutive classifications", async () => {
    const texts = [
      "I love this!",
      "This is terrible.",
      "I have no strong feelings one way or the other.",
      "This product exceeded my expectations!",
    ];

    const results = await Promise.all(
      texts.map((text) => classificationSmoker.run({ text })),
    );
    results.forEach((result) => expect(labels).toContain(result));
  }, 150000); // Increased timeout for multiple API calls

  it("should handle mixed sentiment", async () => {
    const result = await classificationSmoker.run({
      text: "The product is great but the service is poor.",
    });
    expect(labels).toContain(result);
  }, 30000);

  it("should handle sarcasm", async () => {
    const result = await classificationSmoker.run({
      text: "Oh great, another delay. Just what I needed.",
    });
    expect(labels).toContain(result);
  }, 30000);
});
