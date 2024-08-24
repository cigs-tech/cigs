import { z, ZodSchema } from 'zod';
import { getStructuredResponse } from './getStructuredResponse';

/**
 * Processes the input by either validating it directly or parsing it and validating it if it’s a string.
 *
 * @template TInput - The expected type of the input to be validated.
 *
 * @param {TInput | string} input - The input to be processed, either as a direct value of type `TInput` or as a string to be parsed and validated.
 * @param {ZodSchema<TInput>} inputSchema - The Zod schema used for validation.
 * @param {string} [description] - An optional description to guide the parsing process.
 * @param {string} [name] - An optional name for the parsed result.
 * @param {Object} [options] - Optional settings.
 * @param {string} [options.model='gpt-4o-2024-08-06'] - The OpenAI model to use for parsing if the input is a string.
 * 
 * @returns {Promise<TInput>} The validated input of type `TInput`.
 *
 * @throws {Error} Will throw an error if validation fails or if the input is invalid.
 *
 * @remarks
 * This method first checks if the `input` is a string. If so, it uses `getStructuredResponse` to parse and validate the input against the provided `inputSchema`.
 * If the input is not a string, it is directly validated using the `inputSchema`.
 * 
 * @example
 * ```typescript
 * const validatedInput = await processInput<MyType>(
 *   "raw input string",
 *   myTypeSchema,
 *   "Parse and validate raw input",
 *   "ValidatedResult",
 *   { model: "gpt-4o-2024-08-06" }
 * );
 * console.log(validatedInput); // Output: the validated input of type MyType
 * ```
 */
export async function processInput<TInput>(
  input: TInput | string,
  inputSchema?: ZodSchema<TInput>,
  name?: string,
  options: { model?: string } = {}
): Promise<TInput> {
  const { model = 'gpt-4o-2024-08-06' } = options;

  if (!inputSchema) {
    return input as TInput;
  }

  if (typeof input === 'string') {
    return getStructuredResponse(input, inputSchema, undefined, name, { model });
  }

  try {
    return inputSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input format: ${error.errors.map((err) => err.message).join(', ')}`);
    }
    throw new Error('Invalid input format');
  }
}
