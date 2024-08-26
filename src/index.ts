/**
 * The main entry point for the cig AI function library.
 *
 * @packageDocumentation
 *
 * @remarks
 * This module provides tools for building various AI functions, including
 * classification, extraction, tool execution, and generation. It re-exports
 * the `zod` library for schema validation and exports the `cig` function as
 * the primary interface for creating AI functions.
 */

import { z } from "zod";
import { cig } from "./smoke.ts"; // Add .ts extension

/**
 * Re-export of the zod library for schema validation.
 */
export { z };

/**
 * The main function for creating and configuring AI functions.
 *
 * @remarks
 * The `cig` function allows you to create various types of AI functions
 * with customizable configurations. It supports operations such as
 * classification, schema transformation, generation, and tool execution.
 *
 * @example
 * Creating a simple AI function:
 * ```typescript
 * import cig from 'your-library';
 * import { z } from 'zod';
 *
 * const aiFunction = cig('MyAI')
 *   .schema(z.object({ input: z.string() }), (config) => {
 *     config.setDescription('A custom AI function')
 *          .addInstruction('Process the input string');
 *   });
 *
 * const result = await aiFunction.run({ input: 'Hello, AI!' });
 * ```
 *
 * @returns An instance of {@link ChainSmoker} that can be further configured or executed.
 */
export default cig;
