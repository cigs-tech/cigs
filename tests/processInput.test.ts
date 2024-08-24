import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { processInput } from '../src/utils';

// Mock the getStructuredResponse function
vi.mock('./getStructuredResponse', () => ({
  getStructuredResponse: vi.fn(),
}));

describe('processInput', () => {
  const inputSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const inputSchemaFormatted = z.object({
    name: z.string().describe("The name of the user, last name first, comma separated"),
    favoriteColorInFrench: z.string().describe("Users favorite color in french"),
  });

  it('should process valid input object', async () => {
    const input = { name: 'John', age: 25 };
    const result = await processInput(input, inputSchema);
    expect(result).toEqual(input);
  });

  // it('should process valid input string', async () => {
  //   const inputString = "Her name is Alice and she is 30 years old";
  //   vi.mocked(structuredResponseModule.getStructuredResponse).mockResolvedValue({ name: 'Alice', age: 30 });
  //   const result = await processInput(inputString, inputSchema);
  //   expect(result).toEqual({ name: 'Alice', age: 30 });
  // });

  it('should throw an error for invalid input', async () => {
    const invalidInput = { name: 'Bob', age: 'invalid' };
    // @ts-ignore
    await expect(processInput(invalidInput, inputSchema)).rejects.toThrow('Invalid input format');
  });

  // it('should process valid input string with formatted schema', async () => {
  //   const inputString = "Her name is Sarah Ellis and her favorite color is blue";
  //   const description = "Extract a name and age but formatted as last name first, comma separated, and her favorite color in french, masculine spelling";
  //   vi.mocked(structuredResponseModule.getStructuredResponse).mockResolvedValue({ name: 'Ellis, Sarah', favoriteColorInFrench: "bleu" });
  //   const result = await processInput(inputString, inputSchemaFormatted, description);
  //   expect(result).toEqual({ name: 'Ellis, Sarah', favoriteColorInFrench: "bleu" });
  // });

  it('should return input directly if no schema is provided', async () => {
    const input = { someField: 'value' };
    const result = await processInput(input);
    expect(result).toEqual(input);
  });
});