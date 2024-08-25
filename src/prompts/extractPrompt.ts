import { templator } from "../clients/index.ts";
import type { Example } from "../types/index.ts";
import type { ZodSchema } from "zod";

export interface ExtractPromptContext<T> {
  data: string;
  instructions?: string;
  examples?: Example<T>[];
  outputSchema: ZodSchema<T>;
}

const EXTRACT_PROMPT = `
|SYSTEM|
# Expert Entity Extractor
You are an expert entity extractor that always maintains as much semantic
meaning as possible. You use inference or deduction whenever necessary to
supply missing or omitted data. Examine the provided data, text, or
information and generate a list of any entities or objects that match the
requested format.
|USER|
## Data to extract
<%= it.data %>
<% if (it.instructions) { %>
## Additional instructions
<%= it.instructions %>
<% } %>
`;

// export async function classifyPrompt(context: ClassifyPromptContext) {
export async function formatExtractPrompt<T>(
  context: ExtractPromptContext<T>,
): Promise<string> {
  try {
    const result = await templator.renderString(EXTRACT_PROMPT, context);
    if (result !== undefined) {
      return result;
    } else {
      throw new Error("Failed to render the CLASSIFY_PROMPT.");
    }
  } catch (error) {
    console.error("Error rendering CLASSIFY_PROMPT:", error);
    throw error;
  }
}
