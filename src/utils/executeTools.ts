import { openAIClient } from "../clients/openai";
import { createTools } from "./createTools";
import type { ChainSmoker } from "../smoke";

/**
 * Executes a series of tools provided in the `uses` array on the raw text input.
 *
 * @template TInput - The type of input for the AI functions.
 * @template TOutput - The type of output for the AI functions.
 *
 * @param {AIFunction<TInput, TOutput>[]} uses - An array of `AIFunction`s to execute. Each function processes the input text and contributes to the final output.
 * @param {string} rawText - The raw text input to process.
 * @param {string} [description] - An optional description to guide the tool execution.
 * @param {Object} [options] - Optional settings for processing the input.
 * @param {string} [options.model='gpt-4o-2024-08-06'] - The OpenAI model to use for processing.
 *
 * @returns {Promise<string>} The final content after all tools have been executed.
 *
 * @throws {Error} Will throw an error if the final content is `null`.
 *
 * @remarks
 * This function processes the `rawText` input by executing a series of tools specified in the `uses` array.
 * Each tool is created using the `createTools` function and is run sequentially using the OpenAI model specified in the `options`.
 *
 * The function listens for tool outputs during execution and ensures that the final content is non-null before returning it.
 * If the final content is `null`, an error is thrown.
 */

export async function executeTools(
  tools: ChainSmoker<any, any>[],
  rawText: string,
  description?: string,
  options: { model?: string } = {},
): Promise<string> {
  const { model = "gpt-4o-2024-08-06" } = options;
  const createdTools = createTools(tools);

  const messages = [
    {
      role: "system" as const,
      content: description || "Use the supplied tools to assist the user.",
    },
    {
      role: "user" as const,
      content: rawText,
    },
  ];

  const runnerInstance = openAIClient.beta.chat.completions
    .runTools({
      model,
      messages,
      tools: createdTools,
    })
    .on("message", (message: any) => {
      if (message.role === "tool") {
        // console.log(`Tool ${message.name} output: `, message.content);
      } else {
        // console.log(`Assistant: ${message.content} `);
      }
    });

  const finalContent = await runnerInstance.finalContent();
  if (finalContent === null) {
    throw new Error("Final content is null");
  }
  return finalContent;
}
