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

const generate = cig("album-generator", albumInputSchema, (config) => {
  config.setModel("gpt-4o-2024-08-06");
  config.setLogLevel(1);
  config.addInstruction(
    "Generate a list of fake albums that sound like they would be for a given genre",
  );
})
  .generate(albumSchema, 5, (config) => {
    config.addInstruction(
      "Generate a list of fake albums that sound like they would be for a given genre",
    );
  });

(async () => {
  try {
    const result = await generate.run({ genre: "rock" });
    console.log(result); // { sentiment: 'positive' }

    // You can also call the functions with natural language
    // And it will map it properly
    // const result2 = await generate.run("I want a list of rock albums");
    // console.log(result); // { sentiment: 'positive' }
  } catch (error) {
    console.error("Error:", error);
  }
})();
