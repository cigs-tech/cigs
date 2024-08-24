import OpenAI from 'openai';

export const openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });