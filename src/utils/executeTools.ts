import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodSchema, z } from "zod";
import { openAIClient } from "../clients/index.ts";
import type { ChainSmoker } from "../smoke.ts";
import { createTools } from "./createTools.ts";

/**
 * Executes a series of tools on the raw text input.
 *
 * @template T - The Zod schema type for output validation.
 *
 * @param {ChainSmoker<any, any>[]} tools - An array of ChainSmoker tools to execute. Each tool processes the input and contributes to the final output.
 * @param {string} rawText - The raw text input to process.
 * @param {T} [schema] - Optional Zod schema for output validation and parsing.
 * @param {string} [description] - An optional description to guide the tool execution.
 * @param {Object} [options] - Optional settings for processing the input.
 * @param {string} [options.model='gpt-4o-2024-08-06'] - The OpenAI model to use for processing.
 *
 * @returns {Promise<T extends ZodSchema<any> ? z.infer<T> : string>} The final content after all tools have been executed, parsed if a schema is provided.
 *
 * @throws {Error} Will throw an error if the final content is `null`.
 *
 * @remarks
 * This function processes the `rawText` input by executing a series of tools specified in the `tools` array.
 * Each tool is created using the `createTools` function and is run sequentially using the OpenAI model specified in the `options`.
 *
 * The function listens for tool outputs during execution and ensures that the final content is non-null before returning it.
 * If a schema is provided, the final content is parsed and validated against it.
 * If the final content is `null`, an error is thrown.
 */
export async function executeTools<T extends ZodSchema<any>>(
	tools: ChainSmoker<any, any>[],
	rawText: string,
	schema?: T,
	description?: string,
	options: { model?: string } = {},
): Promise<T extends ZodSchema<any> ? z.infer<T> : string> {
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

	const runnerOptions: any = {
		model,
		messages,
		tools: createdTools,
	};

	if (schema) {
		runnerOptions.response_format = zodResponseFormat(schema, "result");
	}

	const runnerInstance =
		openAIClient.beta.chat.completions.runTools(runnerOptions);
	// .on("message", (message: any) => {
	//   if (message.role === "tool") {
	//     // console.log(`Tool ${message.name} output: `, message.content);
	//   } else {
	//     // console.log(`Assistant: ${message.content}`);
	//   }
	// })
	// .on("functionCall", (message: any) => {
	//   // console.log(`Function call: ${message.name}`, message.arguments);
	// })
	// .on("finalFunctionCallResult", (message: any) => {
	//   // console.log(`Final function call result: ${message.name}`, message.arguments);
	// });

	const finalContent = await runnerInstance.finalContent();
	if (finalContent === null) {
		throw new Error("Final content is null");
	}

	if (schema) {
		return schema.parse(JSON.parse(finalContent)) as T extends ZodSchema<any>
			? z.infer<T>
			: string;
	}
	return finalContent as T extends ZodSchema<any> ? z.infer<T> : string;
}
