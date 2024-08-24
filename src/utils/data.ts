/**
 * Prepares the given data by converting it to a string format.
 *
 * @param {any} data - The data to be prepared. Can be a single item or an array of items.
 * 
 * @returns {string} A string representation of the data. If the input is an array, each item is converted to a string and joined by a newline.
 *
 * @remarks
 * This function checks if the provided `data` is an array. If it is, each item in the array is converted to a string using `outputToString` and joined together with newline characters.
 * If the `data` is not an array, it is directly converted to a string using `outputToString`.
 * 
 * @example
 * ```typescript
 * const dataArray = [1, "text", { key: "value" }];
 * const result = prepareData(dataArray);
 * console.log(result);
 * // Output: "1\ntext\n{\"key\":\"value\"}"
 * 
 * const singleData = { key: "value" };
 * const resultSingle = prepareData(singleData);
 * console.log(resultSingle);
 * // Output: "{\"key\":\"value\"}"
 * ```
 */
export function prepareData(data: any): string {
  if (Array.isArray(data)) {
    return data.map(item => outputToString(item)).join('\n');
  }
  return outputToString(data);
}

/**
 * Converts the given output to a string.
 *
 * @param {any} output - The output to be converted. Can be of any type.
 * 
 * @returns {string} A string representation of the output. If the output is `null` or `undefined`, an empty string is returned.
 *
 * @remarks
 * This function handles different types of `output`:
 * - If the `output` is `null` or `undefined`, it returns an empty string.
 * - If the `output` is already a string, it returns the string.
 * - Otherwise, it attempts to convert the `output` to a JSON string. If that fails, it converts the `output` to a string using `String(output)`.
 * 
 * @example
 * ```typescript
 * const result1 = outputToString(null);
 * console.log(result1); // Output: ""
 * 
 * const result2 = outputToString("text");
 * console.log(result2); // Output: "text"
 * 
 * const result3 = outputToString({ key: "value" });
 * console.log(result3); // Output: "{\"key\":\"value\"}"
 * 
 * const result4 = outputToString(123);
 * console.log(result4); // Output: "123"
 * ```
 */
export function outputToString(output: any): string {
  if (output === null || output === undefined) {
    return '';
  }
  if (typeof output === 'string') {
    return output;
  }
  try {
    return JSON.stringify(output);
  } catch {
    return String(output);
  }
}

