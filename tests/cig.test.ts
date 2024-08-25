import { describe, expect, it } from "vitest";
import { z } from "zod";
import cig from "../src/index";

describe("Cig", () => {
  const inputSchema = z.object({ input: z.string() });

  describe("schema method", () => {
    it("should transform input using schema method", async () => {
      const outputSchema = z.object({ output: z.string() });
      const smoker = cig("test", inputSchema, (config) => {
        config.setDescription("Transform the input to all caps");
        config.setModel("gpt-4o-2024-08-06");
      }).schema(outputSchema, (config) => {
        config.addInstruction("Convert the input to uppercase");
      });

      const result = await smoker.run({ input: "hello world" });
      expect(result).toHaveProperty("output");
      expect(typeof result.output).toBe("string");
      expect(result.output.toUpperCase()).toBe(result.output);
    });
  });

  describe("generate method", () => {
    it("should generate multiple outputs", async () => {
      const outputSchema = z.object({ word: z.string() });
      const smoker = cig("test", inputSchema, (config) => {
        config.setDescription("Generate three random words");
        config.setModel("gpt-4o-2024-08-06");
      }).generate(outputSchema, 3, (config) => {
        config.addInstruction("Generate three random words based on the input");
      });

      const result = await smoker.run({ input: "test" });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      result.forEach((item) => {
        expect(item).toHaveProperty("word");
        expect(typeof item.word).toBe("string");
      });
    });
  });

  describe("classify method", () => {
    it("should classify input", async () => {
      const labels = ["positive", "negative", "neutral"];
      const smoker = cig("test", inputSchema, (config) => {
        config.setDescription("Classify the sentiment of the input");
        config.setModel("gpt-4o-2024-08-06");
      }).classify(labels, (config) => {
        config.addInstruction("Classify the sentiment of the input");
      });

      const result = await smoker.run({ input: "I love this product!" });
      expect(labels).toContain(result);
    });
  });

  describe("handler method", () => {
    it("should process input with custom handler", async () => {
      const smoker = cig("test", inputSchema, (config) => {
        config.setDescription("Reverse the input string");
        config.setModel("gpt-4o-2024-08-06");
      }).handler((input) => {
        return { processed: input.input.split("").reverse().join("") };
      });

      const result = await smoker.run({ input: "hello" });
      expect(result).toEqual({ processed: "olleh" });
    });
  });

  describe("uses method", () => {
    it("should use other ChainSmoker instances", async () => {
      const reverseSmoker = cig("reverse", inputSchema, (config) => {
        config.setDescription(
          "Reverse the input string. Just return the reversed string, nothing else",
        );
        config.setModel("gpt-4o-2024-08-06");
      }).handler((input) => ({
        reversed: input.input.split("").reverse().join(""),
      }));

      const upperCaseSmoker = cig(
        "uppercase",
        z.object({ reversed: z.string() }),
        (config) => {
          config.setDescription("Convert the reversed string to uppercase");
          config.setModel("gpt-4o-2024-08-06");
        },
      ).handler((input) => ({ uppercased: input.reversed.toUpperCase() }));

      const smoker = cig("test", inputSchema, (config) => {
        config.setDescription(
          "Reverse the input and then convert it to uppercase",
        );
        config.setModel("gpt-4o-2024-08-06");
      }).uses([reverseSmoker, upperCaseSmoker], (config) => {
        config.addInstruction(
          "Reverse the input and then convert it to uppercase",
        );
      })
        .schema(z.object({ final: z.string() }));

      const result = await smoker.run({ input: "hello" });

      expect(result.final).toBe("OLLEH");
    });
  });

  describe("log method", () => {
    it("should log intermediate results", async () => {
      let loggedValue: any;
      const smoker = cig("test", inputSchema, (config) => {
        config.setDescription("Log intermediate results");
        config.setModel("gpt-4o-2024-08-06");
      })
        .handler((input) => ({ processed: input.input.toUpperCase() }))
        .log((data) => {
          loggedValue = data;
        })
        .handler((input) => ({ final: input.processed + "!" }));

      const result = await smoker.run({ input: "hello" });
      expect(loggedValue).toEqual({ processed: "HELLO" });
      expect(result).toEqual({ final: "HELLO!" });
    });
  });
});

describe("cig function", () => {
  it("should create a configurable ChainSmoker instance", async () => {
    const inputSchema = z.object({ input: z.string() });
    const smoker = cig("test", inputSchema, (config) => {
      config.setDescription("Test configurable ChainSmoker");
      config.setModel("gpt-4o-2024-08-06");
    });

    // expect(smoker).toBeInstanceOf(ChainSmoker);

    const configuredSmoker = smoker.schema(
      z.object({ output: z.string() }),
      (config) => {
        config.addInstruction("Convert the input to uppercase");
      },
    );

    const result = await configuredSmoker.run({ input: "test" });
    expect(result).toHaveProperty("output");
    expect(typeof result.output).toBe("string");
    expect(result.output.toUpperCase()).toBe(result.output);
  });
});
