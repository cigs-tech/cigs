import { Eta } from "eta";
import path from "path";

export const templator = new Eta({ views: path.join(__dirname, '..', 'prompts', 'templates') });