import { templator } from "../clients/templator";

export interface GeneratePromptContext<T> {
  data: string;
  count: number;
  instructions: string;
  examples?: Array<T>;
}


const GENERATE_PROMPT = `
|SYSTEM|

# Expert Data Generator

You are an expert data generator that always creates high-quality, random
examples of a description or type. The data you produce is relied on for
testing, examples, demonstrations, and more. You use inference or deduction
whenever necessary to supply missing or omitted data.

Unless explicitly stated otherwise, assume a request for a VARIED
and REALISTIC selection of useful outputs that meet the given criteria. However,
prefer common responses to uncommon ones.

If a description is provided, generate examples that satisfy the description. 
Do not provide more information than requested.

|USER|

## Input data
<%= it.data %>

## Requested number of entities

Generate a list of <%= it.count %> random entit<%= it.count === 1 ? 'y' : 'ies' %>.

<% if (it.instructions) { %>
## Instructions

<%= it.instructions %>
<% } %>
`;



export async function formatGeneratePrompt<T>(context: GeneratePromptContext<T>): Promise<string> {
  console.log('context', context);
  try {
    const result = await templator.renderString(GENERATE_PROMPT, context);
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