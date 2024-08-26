import { templator } from "../clients/index.ts";
import type { Example } from "../types/index.ts";

export interface DefaultPromptContext<T> {
	data: string;
	instructions?: string;
	examples?: Example<T>[];
}

const DEFAULT_PROMPT = `
|SYSTEM|
Do you best to answer the question given the provided context.

|USER|
## Input
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

`;

export async function formatDefaultPrompt<T>(
	context: DefaultPromptContext<T>,
): Promise<string> {
	try {
		const result = await templator.renderString(DEFAULT_PROMPT, context);
		if (result !== undefined) {
			return result;
		}

		throw new Error("Failed to render the DEFAULT_PROMPT.");
	} catch (error) {
		console.error("Error rendering DEFAULT_PROMPT:", error);
		throw error;
	}
}
