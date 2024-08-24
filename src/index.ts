/**
 * The main entry point for the cig AI function library.
 *
 * @remarks
 * This module re-exports the `zod` library for schema validation and the `cig` function for building various AI functions, including classification, extraction, tool execution, and generation.
 *
 * @packageDocumentation
 */

export { z } from 'zod';
import { cig } from './smoke';

/**
 * The default export is the `cig` function, which allows you to create and configure different types of AI functions.
 *
 * @example
 * ```typescript
 * import cig from 'your-library';
 *
 * const aiFunction = cig()
 *   .name("MyAI")
 *   .description("A custom AI function")
 *   .inputSchema(z.object({ input: z.string() }))
 *   .outputSchema(z.string())
 *   .build();
 * ```
 */
export default cig;