import { Logger } from 'tslog';
import { z, ZodSchema, ZodType } from 'zod';

import { openAIClient } from './clients';
import { formatClassifyPrompt, formatExtractPrompt, formatGeneratePrompt } from './prompts';
import { ChainSmokerConfig, CustomLogObj, Example, Operation } from './types';
import { createLogitBias, executeTools, getStructuredResponse, processInput } from './utils';

/**
 * A utility class for configuring ChainSmoker operations.
 * 
 * @typeParam T - The type of data being configured.
 */
export class Configurator<T> {
  private _config: Partial<ChainSmokerConfig> = {};

  /**
   * Sets the description for the operation.
   * 
   * @param description - A string describing the operation.
   * @returns The Configurator instance for method chaining.
   */
  setDescription(description: string): this {
    this._config.description = description;
    return this;
  }

  /**
   * Sets the AI model to be used for the operation.
   * 
   * @param model - The name or identifier of the AI model.
   * @returns The Configurator instance for method chaining.
   */
  setModel(model: string): this {
    this._config.model = model;
    return this;
  }

  /**
   * Sets the log level for the operation.
   * 
   * @param level - The numeric log level.
   * @returns The Configurator instance for method chaining.
   */
  setLogLevel(level: number): this {
    this._config.logLevel = level;
    return this;
  }

  /**
   * Adds an instruction for the AI model.
   * 
   * @param instruction - A string containing instructions for the AI model.
   * @returns The Configurator instance for method chaining.
   */
  addInstruction(instruction: string): this {
    this._config.instruction = instruction;
    return this;
  }

  /**
   * Adds an example input-output pair for the AI model.
   * 
   * @param input - The example input.
   * @param output - The expected output for the given input.
   * @returns The Configurator instance for method chaining.
   */
  addExample(input: string, output: T): this {
    if (!this._config.examples) {
      this._config.examples = [];
    }
    this._config.examples.push({ input, output });
    return this;
  }

  getConfig(): Partial<ChainSmokerConfig> {
    return this._config;
  }

  getInstruction(): string {
    return this._config.instruction || '';
  }

  getExamples(): Example<T>[] {
    return this._config.examples || [];
  }
}

/**
 * Represents a configurable AI function pipeline.
 * 
 * @typeParam I - The input type for the AI function.
 * @typeParam O - The output type for the AI function.
 */
export class ChainSmoker<I = any, O = I> {
  private operations: Operation<any, any>[] = [];
  private inputSchema: ZodSchema<I> | null
  private outputSchema: ZodSchema<O>;
  private logger: Logger<CustomLogObj>;
  public config: ChainSmokerConfig;

  /**
   * Creates a new ChainSmoker instance.
   * 
   * @param name - The name of the ChainSmoker instance.
   * @param inputSchema - The Zod schema for the input, or null if not specified.
   * @param config - Partial configuration for the ChainSmoker.
   */
  constructor(name: string, inputSchema: ZodSchema<I> | null = null, config: Partial<ChainSmokerConfig>) {
    this.inputSchema = inputSchema;
    this.outputSchema = inputSchema as unknown as ZodSchema<O>;
    this.config = {
      name,
      logLevel: config.logLevel ?? 5,
      model: config.model ?? 'gpt-4o-2024-08-06',
      description: config.description ?? '',
      instruction: config.instruction ?? '',
      examples: config.examples ?? [],
    };
    this.logger = new Logger<CustomLogObj>({ name: `cig-${name}`, minLevel: this.config.logLevel });
  }

  /**
   * Gets the input schema for the ChainSmoker.
   * 
   * @returns The Zod schema for the input.
   */
  getInputSchema(): ZodSchema<I> {
    const schema = this.inputSchema || z.object({ input: z.string() });
    return schema as ZodSchema<I>;
  }

  /**
   * Transforms the output of the previous operation using a Zod schema.
   * 
   * @typeParam NewO - The new output type after schema transformation.
   * @param schema - The Zod schema to apply to the output.
   * @param configurator - Optional function to configure the operation.
   * @returns A new {@link ChainSmoker} instance with the updated output type.
   */
  schema<NewO>(
    schema: ZodSchema<NewO>,
    configurator?: (config: Configurator<NewO>) => void
  ): ChainSmoker<I, NewO> {
    const config = new Configurator<NewO>();
    if (configurator) {
      configurator(config);
    }

    const operation: Operation<O, NewO> = async (input: O) => {
      const instruction = config.getInstruction();
      const examples = config.getExamples();
      this.logger.debug({ operation: "schema", context: 'init', input, instruction, examples });
      const promptContext = {
        data: JSON.stringify(input),
        instructions: instruction,
        examples,
        outputSchema: schema,
      };
      const prompt = await formatExtractPrompt(promptContext);
      this.logger.trace({ operation: "schema", context: 'extracted prompt', prompt });
      return getStructuredResponse(
        JSON.stringify(input),
        schema,
        prompt,
        'result',
        { model: this.config.model }
      );
    };

    const newChainSmoker = new ChainSmoker<I, NewO>(
      this.config.name,
      this.inputSchema,
      {
        ...this.config,
        instruction: config.getInstruction(),
        examples: config.getExamples(),
      }
    );
    newChainSmoker.operations = [...this.operations, operation];
    return newChainSmoker;
  }

  /**
   * Generates multiple outputs based on the input.
   * 
   * @typeParam NewO - The type of each generated output.
   * @param schema - The Zod schema for each generated output.
   * @param count - The number of outputs to generate.
   * @param configurator - Optional function to configure the operation.
   * @returns A new {@link ChainSmoker} instance with an array output type.
   */
  generate<NewO>(
    schema: ZodSchema<NewO>,
    count: number,
    configurator?: (config: Configurator<NewO>) => void
  ): ChainSmoker<I, NewO[]> {
    const config = new Configurator<NewO>();
    if (configurator) {
      configurator(config);
    }
    const operation: Operation<O, NewO[]> = async (input: O) => {
      this.logger.debug({ operation: "generate", context: 'init', input, instruction: config.getInstruction(), examples: config.getExamples() });
      const promptContext = {
        data: JSON.stringify(input),
        count,
        instructions: config.getInstruction(),
        examples: config.getExamples(),
      };
      const prompt = await formatGeneratePrompt(promptContext);
      this.logger.trace({ operation: "generate", context: 'extracted prompt', prompt });
      const wrappedSchema = z.object({ results: z.array(schema) });
      const response = await getStructuredResponse(
        JSON.stringify(input),
        wrappedSchema,
        prompt,
        'result',
        { model: this.config.model }
      );
      return response.results;
    };
    const newChainSmoker = new ChainSmoker<I, NewO[]>(
      this.config.name,
      this.inputSchema,
      {
        ...this.config,
        instruction: config.getInstruction(),
        examples: config.getExamples(),
      }
    );
    newChainSmoker.operations = [...this.operations, operation];
    return newChainSmoker;
  }

  private async defaultOperation(input: string): Promise<string> {
    this.logger.debug({ context: 'Using default operation', input });
    const response = await openAIClient.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: this.config.description || 'Process the following input.' },
        { role: 'user', content: input },
      ],
    });
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Classifies the input into one of the provided labels.
   * 
   * @param labels - An array of possible classification labels.
   * @param configurator - Optional function to configure the operation.
   * @returns A new {@link ChainSmoker} instance with a string output type.
   */
  classify(
    labels: string[],
    configurator?: (config: Configurator<string>) => void
  ): ChainSmoker<I, string> {
    const config = new Configurator<string>();
    if (configurator) {
      configurator(config);
    }
    const operation: Operation<O, string> = async (input: O) => {
      this.logger.debug({ operation: "classify", context: 'init', input, instruction: config.getInstruction(), examples: config.getExamples() });
      const promptContext = {
        data: JSON.stringify(input),
        instructions: config.getInstruction(),
        examples: config.getExamples(),
        labels,
      };
      const prompt = await formatClassifyPrompt(promptContext);
      this.logger.trace({ operation: "classify", context: 'extracted prompt', prompt });
      const logitBias = createLogitBias(labels);
      const response = await openAIClient.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 1,
        logit_bias: logitBias,
      });
      const labelIndex = parseInt(response.choices[0]?.message?.content || '0', 10);
      return labels[labelIndex];
    };
    const newChainSmoker = new ChainSmoker<I, string>(
      this.config.name,
      this.inputSchema,
      {
        ...this.config,
        instruction: config.getInstruction(),
        examples: config.getExamples(),
      }
    );
    newChainSmoker.operations = [...this.operations, operation];
    return newChainSmoker;
  }

  /**
   * Applies a custom handler function to the input.
   * 
   * @typeParam NewO - The output type of the handler function.
   * @param handler - A function that processes the input and returns a new output.
   * @returns A new {@link ChainSmoker} instance with the handler's output type.
   */
  handler<NewO>(
    handler: (data: O) => Promise<NewO> | NewO
  ): ChainSmoker<I, NewO> {
    const operation: Operation<O, NewO> = async (input: O) => {
      this.logger.debug({ operation: "handler", context: 'init', input });
      const result = await handler(input);
      return result;
    };
    const newChainSmoker = new ChainSmoker<I, NewO>(
      this.config.name,
      this.inputSchema,
      this.config
    );
    newChainSmoker.operations = [...this.operations, operation];
    return newChainSmoker;
  }

  /**
   * Executes a series of tools (other ChainSmoker instances) on the input.
   * 
   * @param tools - An array of ChainSmoker instances to be used as tools.
   * @param configurator - Optional function to configure the operation.
   * @returns A new {@link ChainSmoker} instance with a string output type.
   */
  uses(
    tools: ChainSmoker<any, any>[],
    configurator?: (config: Configurator<string>) => void
  ): ChainSmoker<I, string> {
    const config = new Configurator<string>();
    if (configurator) {
      configurator(config);
    }
    const operation: Operation<O, string> = async (input: O) => {
      this.logger.debug({ operation: "uses", context: 'init', input, instruction: config.getInstruction() });
      const finalContent = await executeTools(
        tools,
        JSON.stringify(input),
        config.getInstruction(),
        { model: this.config.model }
      );

      this.logger.debug({ operation: "uses", context: 'received tool execution output', finalContent, instruction: config.getInstruction() });
      return finalContent;
    };
    const newChainSmoker = new ChainSmoker<I, string>(
      this.config.name,
      this.inputSchema,
      {
        ...this.config,
        instruction: config.getInstruction(),
        examples: config.getExamples(),
      }
    );
    newChainSmoker.operations = [...this.operations, operation];
    return newChainSmoker;
  }

  /**
   * Adds a logging step to the pipeline without modifying the data.
   * 
   * @param logger - A function that logs the current state of the data.
   * @returns A new {@link ChainSmoker} instance with the same input and output types.
   */
  log(logger: (input: O) => void): ChainSmoker<I, O> {
    const logOperation: Operation<O, O> = async (data: O) => {
      logger(data);
      return data;
    };

    const newChainSmoker = new ChainSmoker<I, O>(
      this.config.name,
      this.inputSchema,
      this.config
    );
    newChainSmoker.operations = [...this.operations, logOperation];
    return newChainSmoker;
  }

  /**
   * Executes the configured AI function pipeline with the given input.
   * 
   * @param input - The input data for the AI function.
   * @returns A promise that resolves to the final output of the AI function pipeline.
   */
  async run(input: I | string): Promise<O> {
    this.logger.info({ context: 'Running cig', input, operationCount: this.operations.length });
    let result: unknown;


    if (typeof input === 'string') {
      this.logger.debug({ context: "Received string input" });
      if (this.inputSchema) {
        result = await processInput(input, this.inputSchema, 'input');
        this.logger.debug({ context: 'Processed string input', result });
      } else {
        result = input;
        this.logger.debug({ context: 'Using raw string input (no schema provided)' });
      }
    } else {
      result = this.inputSchema ? this.inputSchema.parse(input) : input;
    }

    if (this.operations.length === 0) {
      // If no operations are specified, use a default operation
      return this.defaultOperation(result as string) as unknown as O
    }

    for (let i = 0; i < this.operations.length; i++) {
      const operation = this.operations[i];
      this.logger.debug({ context: `Operation ${i + 1} Input`, data: result });
      result = await operation(result);
      this.logger.debug({ context: `Operation ${i + 1} Output`, data: result });
    }

    return result as O;
  }
}

/**
 * Defines the structure of the ChainSmokerBuilder function.
 * This type allows for two different calling signatures of the cig function.
 */
type ChainSmokerBuilder = {
  /**
   * Creates a ChainSmoker with a specified input schema.
   * 
   * @typeParam I - The input type for the ChainSmoker.
   * @param name - The name of the ChainSmoker instance.
   * @param inputSchema - The Zod schema for the input.
   * @param configurator - Optional function to configure the ChainSmoker.
   * @returns A new ChainSmoker instance.
   */
  <I>(name: string, inputSchema: ZodSchema<I>, configurator?: (config: Configurator<I>) => void): ChainSmoker<I, I>;

  /**
   * Creates a ChainSmoker without a specified input schema.
   * 
   * @param name - The name of the ChainSmoker instance.
   * @param configurator - Optional function to configure the ChainSmoker.
   * @returns A new ChainSmoker instance.
   */
  (name: string, configurator?: (config: Configurator<any>) => void): ChainSmoker<any, any>;
};

/**
 * The main function for creating and configuring AI functions.
 * 
 * @remarks
 * This function allows for flexible creation of ChainSmoker instances,
 * with or without a specified input schema.
 * 
 * @example
 * Creating a ChainSmoker with a specified schema:
 * ```typescript
 * const myChainSmoker = cig('MyAI', z.object({ input: z.string() }), (config) => {
 *   config.setDescription('A custom AI function')
 *        .addInstruction('Process the input string');
 * });
 * ```
 * 
 * @example
 * Creating a ChainSmoker without a specified schema:
 * ```typescript
 * const myChainSmoker = cig('MyAI', (config) => {
 *   config.setDescription('A custom AI function')
 *        .addInstruction('Process the input');
 * });
 * ```
 */
export const cig: ChainSmokerBuilder = (<I>(
  name: string,
  inputSchemaOrConfigurator?: ZodSchema<I> | ((config: Configurator<any>) => void),
  configurator?: (config: Configurator<I>) => void
): ChainSmoker<I, I> | ChainSmoker<any, any> => {
  let inputSchema: ZodSchema<I> | null = null;
  let config: Partial<ChainSmokerConfig> = {};

  if (inputSchemaOrConfigurator instanceof ZodType) {
    inputSchema = inputSchemaOrConfigurator;
  } else if (typeof inputSchemaOrConfigurator === 'function') {
    configurator = inputSchemaOrConfigurator;
  }

  if (configurator) {
    const cfg = new Configurator<I>();
    configurator(cfg);
    config = cfg.getConfig();
  }

  return new ChainSmoker<I, I>(name, inputSchema, config);
}) as ChainSmokerBuilder;