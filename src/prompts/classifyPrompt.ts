import { templator } from "../clients/index.ts";
import type { Example } from "../types/index.ts";

export interface ClassifyPromptContext<T> {
  data: string;
  instructions?: string;
  examples?: Example<T>[];
  labels: T[];
}

const CLASSIFY_PROMPT = `
|SYSTEM|
# Expert Classifier
You are an expert classifier that always maintains as much semantic meaning
as possible when labeling text. You use inference or deduction whenever
necessary to understand missing or omitted data. Classify the provided data,
text, or information as one of the provided labels. For boolean labels,
consider "truthy" or affirmative inputs to be "true".

|USER|
## Text or data to classify
<%= it.data %>

<% if (it.instructions) { %>
## Additional instructions
<%= it.instructions %>
<% } %>

<% if (it.examples && it.examples.length > 0) { %>
## Examples
<% it.examples.forEach((example, index) => { %>
Example #<%= index + 1 %>:
Input: <%= example.input %>
Label: <%= example.output %>

<% }) %>
<% } %>

## Labels
You must classify the data as one of the following labels, which are numbered (starting from 0) and provide a brief description. Output the label number only.

<% it.labels.forEach((label, index) => { %>
- Label #<%= index %>: <%= label %>
<% }) %>

|ASSISTANT|
The best label for the data is Label
`;

// export async function classifyPrompt(context: ClassifyPromptContext) {
export async function formatClassifyPrompt<T>(
  context: ClassifyPromptContext<T>,
): Promise<string> {
  try {
    const result = await templator.renderString(CLASSIFY_PROMPT, context);
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
