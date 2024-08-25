import { zodFunction } from "openai/helpers/zod";
import type { ChainSmoker } from "../smoke.ts";

/**
 * Creates an array of tools from an array of `AIFunction`s to be used in the execution process.
 *
 * @param {AIFunction<any, any>[]} uses - An array of `AIFunction`s to convert into tools.
 *
 * @returns {Array<ReturnType<typeof zodFunction>>} An array of Zod functions to be used as tools.
 *
 * @remarks
 * This function maps over the provided `uses` array of `AIFunction`s and converts each one into a Zod function using the `zodFunction` helper.
 * Each Zod function is configured with the name, input schema, and description from the corresponding `AIFunction`.
 * The resulting array of Zod functions is returned, ready to be used in the execution process.
 */
export function createTools(tools: ChainSmoker<any, any>[]) {
  return tools.map((tool) => {
    const name = tool.config.name || "No name provided";
    return zodFunction({
      name,
      parameters: tool.getInputSchema(),
      function: async (args: any) => await tool.run(args),
      description: tool.config.description || tool.config.instruction || "No description provided",
    });
  });
}
