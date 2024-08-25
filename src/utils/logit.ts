import { encode } from "gpt-tokenizer";

/**
 * Creates a logit bias map from a list of labels.
 *
 * @param {readonly any[]} labels - An array of labels used to generate the logit bias. The labels are encoded into tokens, and each token is assigned a bias value of 100.
 *
 * @returns {Record<string, number>} A record (object) where the keys are the encoded tokens as strings, and the values are the bias values (100).
 *
 * @remarks
 * This function generates a logit bias map by encoding the index of each label in the `labels` array using the GPT tokenizer.
 * The resulting tokens are then assigned a bias value of 100. This map can be used in language models to influence the likelihood of certain tokens being generated.
 *
 * @example
 * ```typescript
 * const labels = ['label1', 'label2', 'label3'];
 * const logitBias = createLogitBias(labels);
 * console.log(logitBias);
 * // Output: { 'token1': 100, 'token2': 100, 'token3': 100 }
 * ```
 */
export const createLogitBias = (
  labels: readonly any[],
): Record<string, number> => {
  const logitBias: Record<string, number> = {};
  labels.forEach((_, index) => {
    const token = encode(index.toString())[0];
    logitBias[token] = 100;
  });
  return logitBias;
};
