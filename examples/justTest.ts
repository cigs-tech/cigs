import { cig } from "../src/smoke"
import { z } from 'zod';

// const inputSchema = z.object({
//   description: z.string(),
// });

const inputSchema = z.object({ input: z.string() });

// Define schemas
const personSchema = z.object({
  name: z.string(),
  age: z.number().int(),
});

const nickNameSchema = z.object({
  nickName: z.string(),
});

// const t = cig("PersonExtractor", {
//   model: "gpt-4o-2024-08-06",
//   description: "Extract information about a person",
// })

// const t = cig("PersonExtractor", config => {
//   config.description("Extract the person's name and age");
//   config.setModel("gpt-4o-2024-08-06");
//   config.setLogLevel(5);
// })

// const t = cig("PersonExtractor", inputSchema, config => {
//   config.description("Extract the person's name and age");
//   config.setModel("gpt-4o-2024-08-06");
// })

// Create ChainSmoker instance
// const smoker = cig("PersonExtractor", inputSchema, config => {
// const smoker = cig("PersonExtractor", inputSchema, config => {
//   config.setDescription("Extract the person's name and age, throw an error if no person is found");
//   config.setModel("gpt-4o-2024-08-06");
//   config.setLogLevel(1);
// })
//   // const smoker = cig("PersonExtractor")
//   .schema(personSchema, (config) => {
//     config.addInstruction("Extract the person's name and age");
//     config.addExample("Alice is 45 years old", { name: "Alice", age: 45 });
//   })
//   .schema(nickNameSchema, (config) => {
//     config.addInstruction("Extract or generate a nickname for the person");
//     config.addExample("Alice is 45 years old", { nickName: "Ali" });
//   })
//   .log((input) => {
//     console.log("Intermediate result:", input);
//   });


// const reverseSmoker = cig("reverse", inputSchema, (config) => {
//   config.setDescription('Reverse the input string. Just return the reversed string, nothing else');
//   config.setModel('gpt-4o-2024-08-06');
//   config.setLogLevel(1);
// }).handler(async (input) => ({ reversed: input.input.split('').reverse().join('') }));

const outputSchema = z.object({ reversed: z.string() });

const reverseSmoker = cig("reverse", (config) => {
  config.setDescription('Reverse the input string. Just return the reversed string, nothing else');
  config.setModel('gpt-4o-2024-08-06');
  config.setLogLevel(1);
})
// .schema(outputSchema)

const upperCaseSmoker = cig("uppercase", z.object({ reversed: z.string() }), (config) => {
  config.setDescription('Convert the reversed string to uppercase');
  config.setModel('gpt-4o-2024-08-06');
  config.setLogLevel(1);
}).handler(async (input) => ({ uppercased: input.reversed.toUpperCase() }));

const smoker = cig("test", inputSchema, (config) => {
  config.setDescription('Reverse the input and then convert it to uppercase');
  config.setModel('gpt-4o-2024-08-06');
  config.setLogLevel(1);
}).uses([reverseSmoker, upperCaseSmoker], (config) => {
  config.addInstruction('Reverse the input and then convert it to uppercase');
})
  .schema(outputSchema)


async function main() {
  console.log("Test 1: Running with a string input");
  // const result1 = await smoker.run("Richard Kennedy is a 30-year-old software developer from New York");
  // const result = await smoker.run({ input: 'hello' });
  const result = await reverseSmoker.run("reverse it up");
  console.log("Result 1:", result);

  // smoker.run({ veryCool: "jimmython" })

  // console.log("\nTest 2: Running with an object input");
  // const result2 = await smoker.run({ description: "Barbrah is a 30-year-old software developer from New York" });
  // console.log("Result 2:", result2);

  // console.log("\nTest 3: Running with a different string input");
  // const result3 = await smoker.run("This person is from France and loves croissants");
  // console.log("Result 3:", result3);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});

// const reverseSmoker = cig("reverse", (config) => {
//   config.setDescription('Reverse the input string. Just return the reversed string, nothing else');
//   config.setModel('gpt-4o-2024-08-06');
//   config.setLogLevel(1);
// })

// const output = await  reverseSmoker.run("hello")

// console.log(output)