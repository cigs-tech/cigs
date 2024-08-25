import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ChainSmoker, Configurator } from "../src/smoke";

const inputSchema = z.object({
  name: z.string(),
});

describe("ChainSmoker", () => {
  it("should initialize with the correct input schema", () => {
    const chainSmoker = new ChainSmoker("TestChain", inputSchema, {});
    expect(chainSmoker.getInputSchema()).toBe(inputSchema);
  });

  it("should handle adding instructions and labels in classify configurator", () => {
    const config = new Configurator<string>();
    config.addInstruction("Classify the input");
    expect(config.getInstruction()).toBe("Classify the input");
    expect(config.getExamples()).toEqual([]);
  });

  it("should transform input using schema method", async () => {
    const chainSmoker = new ChainSmoker("TestChain", inputSchema, {});
    const outputSchema = z.object({ upperName: z.string() });

    const transformedChainSmoker = chainSmoker.schema(
      outputSchema,
      (config) => {
        config.addInstruction("Convert the name to uppercase");
      },
    );

    const result = await transformedChainSmoker.run({ name: "john" });
    expect(result).toHaveProperty("upperName");
    expect(result.upperName).toBe("JOHN");
  });

  it("should generate multiple outputs using generate method", async () => {
    const chainSmoker = new ChainSmoker("TestChain", inputSchema, {});
    const outputSchema = z.object({ greeting: z.string() });

    const generatedChainSmoker = chainSmoker.generate(
      outputSchema,
      3,
      (config) => {
        config.addInstruction("Generate greetings using the given name");
      },
    );

    const result = await generatedChainSmoker.run({ name: "Alice" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    result.forEach((item) => {
      expect(item).toHaveProperty("greeting");
      expect(typeof item.greeting).toBe("string");
    });
  });

  it("should classify input using classify method", async () => {
    const chainSmoker = new ChainSmoker("TestChain", inputSchema, {});
    const labels = ["short", "medium", "long"];

    const classifiedChainSmoker = chainSmoker.classify(labels, (config) => {
      config.addInstruction("Classify the name based on its length");
    });

    const shortResult = await classifiedChainSmoker.run({ name: "Bob" });
    expect(labels).toContain(shortResult);

    const longResult = await classifiedChainSmoker.run({ name: "Christopher" });
    expect(labels).toContain(longResult);
  });

  it("should chain multiple operations", async () => {
    const chainSmoker = new ChainSmoker("TestChain", inputSchema, {});

    const transformedChainSmoker = chainSmoker
      .schema(z.object({ upperName: z.string() }), (config) => {
        config.addInstruction("Convert the name to uppercase");
      })
      .schema(z.object({ greeting: z.string() }), (config) => {
        config.addInstruction("Create a greeting using the uppercase name");
      });

    const result = await transformedChainSmoker.run({ name: "emma" });
    expect(result).toHaveProperty("greeting");
    expect(result.greeting).toContain("EMMA");
  });

  it("should handle errors gracefully", async () => {
    const chainSmoker = new ChainSmoker("TestChain", inputSchema, {});

    //@ts-ignore: Ignore the error because we are testing the error handling
    await expect(chainSmoker.run({ wrongField: "test" })).rejects.toThrow();
  });
});
