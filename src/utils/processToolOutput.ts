import type { ZodSchema } from "zod";
import { getStructuredResponse } from "./getStructuredResponse";

/**
 * Processes the final tool output by optionally validating it against a schema.
 *
 * @template TOutput - The expected type of the processed output.
 *
 * @param {string} input - The input be processed.
 * @param {ZodSchema<TOutput>} [outputSchema] - The Zod schema used for validating the output.
 * @param {string} [description] - An optional description to guide the validation process.
 * @param {string} [name] - An optional name for the parsed result.
 * @param {Object} [options] - Optional settings.
 * @param {string} [options.model='gpt-4o-2024-08-06'] - The OpenAI model to use for validation.
 *
 * @returns {Promise<TOutput>} The processed output of type `TOutput`.
 *
 * @throws {Error} Will throw an error if processing fails.
 *
 * @remarks
 * This method can optionally validate the `input` against a provided Zod schema.
 * If the `outputSchema` is provided, the method uses `getStructuredResponse` to perform validation.
 * Otherwise, it simply returns the `input` cast to `TOutput`.
 *
 * @example
 * ```typescript
 * const result = await processToolOutput<string>(
 *   "example content",
 *   someStringSchema,
 *   "Validate example content",
 *   "ExampleResult",
 *   { model: "gpt-4o-2024-08-06" }
 * );
 * console.log(result); // Output: example content
 * ```
 */
export async function processToolOutput<TOutput>(
  input: string,
  outputSchema?: ZodSchema<TOutput>,
  description?: string,
  name?: string,
  options: { model?: string } = {},
): Promise<TOutput> {
  const { model = "gpt-4o-2024-08-06" } = options;

  if (outputSchema) {
    return await getStructuredResponse(input, outputSchema, description, name, {
      model,
    });
  }

  return input as TOutput;
}
