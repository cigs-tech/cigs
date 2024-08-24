import cig, { z } from '../src/index';

const albumInputSchema = z.object({
  genre: z.string()
})

const albumSchema = z.object({
  title: z.string(),
  artist: z.string(),
  year: z.number(),
  numTracks: z.number(),
})

const finalSchema = z.object({
  title: z.string(),
  numTracks: z.number(),
  description: z.string(),
})

const chained = cig("album-generator", albumInputSchema, (config) => {
  config.setModel('gpt-4o-2024-08-06');
  config.setLogLevel(1);
  config.addInstruction('Generate a list of fake albums that sound like they would be for a given genre');
})
  .generate(albumSchema, 5, (config) => {
    config.addInstruction('Generate a list of fake albums that sound like they would be for a given genre');
  })
  .handler(async (input) => {
    console.log(input);
    return input.reduce((maxAlbum, currentAlbum) =>
      currentAlbum.numTracks > maxAlbum.numTracks ? currentAlbum : maxAlbum
    );
  })
  .schema(finalSchema, (config) => {
    config.addInstruction('Generate a description for the album that had the most tracks');
  });


(async () => {
  try {
    const result = await chained.run({ genre: 'classical' });
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  }
})();