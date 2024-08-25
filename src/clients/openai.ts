import OpenAI from "openai";
import { env } from "node:process";

export const openAIClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
