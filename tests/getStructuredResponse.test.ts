import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getStructuredResponse } from "../src/utils";

describe("getStructuredResponse", () => {
  const mockSchema = z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
  });

  const mockInput = "id: 123, name: John Doe, age: 30";

  it("should process input and return structured response", async () => {
    const result = await getStructuredResponse(mockInput, mockSchema);

    expect(result).toEqual(expect.objectContaining({
      id: expect.any(String),
      name: expect.any(String),
      age: expect.any(Number),
    }));
  }, 10000); // Increased timeout for API call

  it("should use provided description and name", async () => {
    const result = await getStructuredResponse(
      mockInput,
      mockSchema,
      "Parse user information with id as a number",
      "UserInfo",
    );

    expect(result).toEqual(expect.objectContaining({
      id: expect.any(String),
      name: expect.any(String),
      age: expect.any(Number),
    }));
  }, 10000);

  it("should use custom model and temperature", async () => {
    const result = await getStructuredResponse(
      mockInput,
      mockSchema,
      undefined,
      undefined,
      { model: "gpt-4o-mini", temperature: 0.5 },
    );

    expect(result).toEqual(expect.objectContaining({
      id: expect.any(String),
      name: expect.any(String),
      age: expect.any(Number),
    }));
  }, 10000);

  it("should use provided maxTokens", async () => {
    const result = await getStructuredResponse(
      mockInput,
      mockSchema,
      undefined,
      undefined,
      { maxTokens: 100 },
    );

    expect(result).toEqual(expect.objectContaining({
      id: expect.any(String),
      name: expect.any(String),
      age: expect.any(Number),
    }));
  }, 10000);

  it("should fail on complex schemas", async () => {
    const complexSchema = z.object({
      user: z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
      }),
      preferences: z.array(z.string()),
      lastLogin: z.date(),
    });

    const complexInput = `
      User info: ID is ABC123, name is Jane Smith, and age is 28.
      User preferences: reading, traveling, cooking
      Last login: 2023-05-15T10:30:00Z
    `;

    await expect(getStructuredResponse(complexInput, complexSchema))
      .rejects.toThrow(/Failed to process input/);
  }, 15000); // Increased timeout for more complex processing
});
