import { env } from "node:process";
import OpenAI from "openai";

export const openAIClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
