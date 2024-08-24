import { ILogObj } from 'tslog';

export type LogLevel = number;

export interface ChainSmokerConfig {
  name: string;
  logLevel: LogLevel;
  model: string;
  description?: string;
  instruction?: string;
  examples?: Example<any>[];
}

export interface CustomLogObj extends ILogObj {
  context?: string;
}

export type Operation<Input, Output> = (input: Input) => Promise<Output>;

export interface Example<T> {
  input: string;
  output: T;
}