import cig, { z } from "../src/index";

const albumInputSchema = z.object({
  genre: z.string(),
});

const albumSchema = z.object({
  title: z.string(),
  artist: z.string(),
  year: z.number(),
  numTracks: z.number(),
});

const finalSchema = z.object({
  title: z.string(),
  numTracks: z.number(),
  description: z.string(),
});

const chained = cig("album-generator");
const simpleZodSchema = z.object({
  words: z.array(z.string()),
});

const cigWithSchema = cig("my-cig", simpleZodSchema);

const cigWithConfig = cig("my-cig", simpleZodSchema, (config) => {
  config.setModel("gpt-4o-2024-08-06");
  config.setLogLevel(1);
  config.addInstruction("Given a list of words, return a sentence using all of them");
});


(async () => {
  try {
    // const result = await cigWithConfig.run({ words: ["Dinosaur", "Typescript", "AI"] });
    const result = await cigWithConfig.run("please use the words Dinosaur, Typescript, and AI");
    // const result = await cigWithConfig.run("wow this library is so cool");
    // const result = await chained.run("Give me a random word");
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  }
})();
