import { Logger } from 'tslog';
import { z, ZodSchema, ZodType, ZodTypeDef } from 'zod';

import { openAIClient } from './clients';
import { formatClassifyPrompt, formatExtractPrompt, formatGeneratePrompt } from './prompts';
import { ChainSmokerConfig, CustomLogObj, Example, Operation } from './types';
import { createLogitBias, executeTools, getStructuredResponse, processInput } from './utils';

export class Configurator<T> {
  private _config: Partial<ChainSmokerConfig> = {};

  setDescription(description: string): this {
    this._config.description = description;
    return this;
  }

  setModel(model: string): this {
    this._config.model = model;
    return this;
  }

  setLogLevel(level: number): this {
    this._config.logLevel = level;
    return this;
  }

  addInstruction(instruction: string): this {
    this._config.instruction = instruction;
    return this;
  }

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

export class ChainSmoker<I = any, O = I> {
  private operations: Operation<any, any>[] = [];
  private inputSchema: ZodSchema<I> | null
  private outputSchema: ZodSchema<O>;
  private logger: Logger<CustomLogObj>;
  public config: ChainSmokerConfig;

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

  getInputSchema(): ZodSchema<I> {
    const schema = this.inputSchema || z.object({ input: z.string() });
    return schema as ZodSchema<I>;
  }

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

    for (let i = 0; i < this.operations.length; i++) {
      const operation = this.operations[i];
      this.logger.debug({ context: `Operation ${i + 1} Input`, data: result });
      result = await operation(result);
      this.logger.debug({ context: `Operation ${i + 1} Output`, data: result });
    }

    return result as O;
  }
}

type ChainSmokerBuilder = {
  <I>(name: string, inputSchema: ZodSchema<I>, configurator?: (config: Configurator<I>) => void): ChainSmoker<I, I>;
  (name: string, configurator?: (config: Configurator<any>) => void): ChainSmoker<any, any>;
};

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