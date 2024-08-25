import { ZodSchema } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { openAIClient } from "../clients";

/**
 * Processes the input by getting a structured response according to the provided Zod schema using OpenAI's API.
 *
 * @template T - The expected type of the validated data.
 *
 * @param {string} input - The input string to be processed.
 * @param {ZodSchema<T>} schema - The Zod schema used for validation.
 * @param {string} [description] - An optional description to guide the parsing process.
 * @param {string} [name] - An optional name for the parsed result.
 * @param {Object} [options] - Optional settings for processing the input.
 * @param {string} [options.model='gpt-4o-2024-08-06'] - The OpenAI model to use for parsing.
 * @param {number} [options.temperature=1] - The temperature setting for the OpenAI model, controlling the randomness of the output.
 * @param {number} [options.maxTokens=null] - The maximum number of tokens to generate in the response.
 *
 * @returns {Promise<T>} The validated data of type `T`.
 *
 * @throws {Error} Will throw an error if parsing or validation fails.
 *
 * @remarks
 * This function uses OpenAI's API to process the input string according to the provided `schema`. The input is sent to the model specified in the `options`, and the response is validated against the schema using the `zodResponseFormat`.
 *
 * If the parsing of the model's output fails according to the schema, an error is thrown.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   age: z.number(),
 * });
 *
 * const input = "id: 123, name: John Doe, age: 30";
 *
 * const result = await getStructuredResponse(input, schema, "Parse user information", "UserInfo", { model: "gpt-4o-2024-08-06" });
 * console.log(result); // Output: { id: "123", name: "John Doe", age: 30 }
 * ```
 */
export async function getStructuredResponse<T>(
  input: string,
  schema: ZodSchema<T>,
  description?: string,
  name?: string,
  options: { model?: string; temperature?: number; maxTokens?: number } = {},
): Promise<T> {
  const { model = "gpt-4o-2024-08-06", temperature = 1, maxTokens = null } =
    options;

  try {
    const completion = await openAIClient.beta.chat.completions.parse({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: description ||
            "Process the input according to the provided schema.",
        },
        { role: "user", content: input },
      ],
      response_format: zodResponseFormat(schema, name || "result"),
    });

    if (completion.choices[0].message.parsed === null) {
      throw new Error(
        "Failed to parse the model's output according to the schema",
      );
    }

    return completion.choices[0].message.parsed;
  } catch (error) {
    throw new Error(`Failed to process input: ${error}`);
  }
}
