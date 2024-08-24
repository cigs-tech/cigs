import cig, { z } from '../src/index';

const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.enum(['male', 'female', 'other']),
  nickname: z.string().describe('a funny nickname for the person')
})


const extract = cig("person-extractor", (config) => {
  config.setModel('gpt-4o-2024-08-06')
  config.setLogLevel(1)
  config.addInstruction('Extract the person from the input text and make up a funny nickname for them')
})
  .schema(personSchema);

(async () => {
  try {
    const result = await extract.run("His name is John and he is 25 years old");
    console.log(result); // { name: 'John', age: 25, gender: 'male', nickname: 'Johnny' }
  } catch (error) {
    console.error("Error:", error);
  }
})();