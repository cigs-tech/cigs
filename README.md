# 🚬 cigs - Ai functions for Typescript

![GitHub top language](https://img.shields.io/github/languages/top/cigs-tech/cigs)
![JSR Version](https://img.shields.io/jsr/v/@cigs/cigs)
[![CI](https://github.com/cigs-tech/cigs/actions/workflows/ci.yml/badge.svg)](https://github.com/cigs-tech/cigs/actions/workflows/ci.yml)
[![GitHub license](https://img.shields.io/github/license/cigs-tech/cigs)](https://github.com/cigs-tech/cigs/blob/main/LICENSE.txt)
[![Twitter Follow](https://img.shields.io/twitter/follow/Jonovono?style=social)](https://twitter.com/Jonovono)

cigs are Ai typescript functions. They are composable intelligent generative snippets that offer new ways to build powerful applications leveraging the latest in Ai. cigs is the lodash for AI functions or GraphQL for code execution.

Think of it like a combination of [instructor](https://github.com/jxnl/instructor), [askmarvin](https://www.askmarvin.ai), and [fructose](https://github.com/bananaml/fructose), but with a few main differences:

- **Uses OpenAI structured outputs**: Structured outputs simplify a lot of the logic of these libraries!
- **Written in TypeScript**: Lots of cool libraries for python, but TS is lacking :(
- **Chainable**: Easily chain multiple cigs together to create complex workflows
- **Type Safe**: Use Zod schemas to ensure the output of your cigs is always correct
- **Flexible**: Call cigs with natural language or with structured inputs
- **Dynamic function response**: You can define a typescript function with a specific input schema. You can then call that function with the input or natural language and specify the desired output schema at run time. We will use OpenAI structured outputs to map the function response to the desired output schema. So you can have one function be called from different places all with different type-safe outputs

![cigs](https://i.imgur.com/QvJerh0.png)

> [!CAUTION]
> This library is still under development
> I will be erring on the side of speed Please join the Discord if you need help or something is broken

## What are cigs

- **Natural Language Execution**: Run TypeScript functions using natural language inputs.
- **Composable Workflows**: Chain multiple AI functions to create complex workflows.
- **Helper Functions**: Simplify common tasks like classification, extraction, and generation.
- **Type Safety**: Ensure structured outputs with Zod schemas.
- **Flexible Outputs**: Call functions and get responses in specified formats.

Sounds weird, but with some examples it might make more sense

## Installation

```bash
export OPENAI_API_KEY='...'    # currently required for core functionality
```

### npm / node

```bash
# Trying out jsr, I hate tsconfig and all that
# If anyone wants it as a npm package, let me know
npx jsr add @cigs/cigs
```

```ts
import cig, { z } from "@cigs/cigs";
```

### deno

```bash
deno add @cigs/cigs
```

```ts
import { cig, z } from "@cigs/cigs";
```

## Current Supported Operations

cigs supports various operations that can be chained together:

- **schema**: Transform the input to a specified output using a Zod schema
- **generate**: Generate multiple outputs based on the schema
- **classify**: Classify the input into predefined categories
- **handler**: Apply a custom handler function
- **uses**: Execute a series of tools (other cigs instances)
- **log**: Add logging without modifying the data to intermediate steps
- ***What else should we support?***

cig supports the following configs

- **setModel**: Set the OpenAI model to use
- **setLogLevel**: Set the log level. 1 will show all the logs, 2 will show less etc
- **setDescription**: Set the description of the cig. This will be passed to OpenAI
- **addInstruction**: Add an instruction to the cig. This will be passed to OpenAI as the system prompt
- **addExample**: Add an example to the cig. This will be passed to OpenAI to help tune the response
- **What else should we support?**

## Usage

### Call a typescript function with natural language

> [!TIP]
> Clone this repo and run this example with `npm run example:handler`

cigs wants to do a lot, but I think something cool about it is you can call a typescript function with natural language

Super simple example, but say you have this function:

```ts
function getUserCompliment(username: string) {
  const colorMap = {
    "Alice": "blue",
    "Bob": "green",
    "Charlie": "red",
  };
  return {
    color: colorMap[input.username as keyof typeof colorMap] || "unknown",
  };
}
```

You can call this function with natural language like this:

```ts
const userInfoSchema = z.object({
  username: z.string(),
});

// Define a cig to get a user's favorite color
const getFavoriteColor = cig("getFavoriteColor", userInfoSchema)
  .handler(async (input) => {
    // Simulated database lookup
    return getUserCompliment(input.username);
  });

// Usage example
(async () => {
  try {
    const result = await getFavoriteColor.run(
      "What is the favorite color of Alice",
    ); // { color: 'blue' }
    console.log(result);

    const result2 = await getFavoriteColor.run(
      "What is the favorite color of Susan",
    ); // { color: 'unknown' }
    console.log(result2);

    // You can also call that function with the specified input
    const result3 = await getFavoriteColor.run({ username: "Alice" }); // { color: 'blue' }
    console.log(result3);
    // Expected output: { username: 'alice', favoriteColor: 'blue', compliment: 'You have great taste!' }
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

### Initializing

There are a few ways to initialize a cigs instance

```ts
import cig, { z } from "@cigs/cigs";

const cig = cig("NAME", INPUT_ZOD_SCHEMA, CONFIGURATOR)
```

No configuration

```ts
// In the simplest case, you can just pass the name of the cig
const simplestCig = cig("my-cig")

// This won't do much of anything, but you can call it with natural language and it will return essentially just the raw input of OpenAI `openAIClient.chat.completions.create` call

const output = await simplestCig.run("Give me a random word");
// Serendipity
```

Just with a input schema. The input schema makes it so you can control the input of the cig. You are still able to call it with natural language and it will map it to the input schema. This is more useful when combined with handler functions, but can be used on its own

```ts
const simpleZodSchema = z.object({
  word: z.string(),
  command: z.string(),
});

const cigWithSchema = cig("my-cig", simpleZodSchema);

const result = await cigWithSchema.run({ word: "hello", command: "translate to french" });
// -> {"word":"hello","translation":"bonjour"}
// this output isn't super helpful. Its a string, so not a typed object
// It's just trying to match the input as best as possible. We will get better below

const result2 = await cigWithSchema.run("translate hello to french");
// -> "Hello" in French is "Bonjour."
```

Just with configuration

```ts
const cigWithConfig = cig("my-cig", (config) => {
  config.setModel("gpt-4o-2024-08-06");
  config.setLogLevel(1);
  config.setDescription("This is a test cig");
  config.addInstruction("Respond with the given phrase in french");
  config.addExample("I love you so much!", "Je t'aime");
});

const result = await cigWithConfig.run("wow this library is so cool");
// -> Wow, cette bibliothèque est tellement cool.
```

With everything

```ts
const simpleZodSchema = z.object({
  words: z.array(z.string()),
});

const cigWithConfig = cig("my-cig", simpleZodSchema, (config) => {
  config.setModel("gpt-4o-2024-08-06");
  config.setLogLevel(1);
  config.addInstruction("Given a list of words, return a sentence using all of them");
});

// Now run it:
const result = await cigWithConfig.run({ words: ["Dinosaur", "Typescript", "AI"] });
// -> Dinosaur enthusiasts have started using Typescript to create interactive AI exhibits in museums worldwide.

// And just like everything, you can also call it with natural language
const result = await cigWithConfig.run("please use the words Dinosaur, Typescript, and AI");
// It will be processed and mapped to the input schema
// {
//   context: 'Processed string input',
//   result: {
//     words: [
//       'Dinosaur',
//       'Typescript',
//       'AI'
//     ]
//   }
// }
// -> In an imaginative world, a dinosaur adeptly coded in TypeScript, creating an advanced AI to predict meteor showers.
```

So ya, it's pretty flexible and can handle a lot of different use cases. This doesn't show off the true power. It gets really fun when you start chaining cigs together and controlling the outputs.

### Quick Start { simple }

> [!TIP] 
> Clone this repo and run this example with `npm run example:simple`

```ts
import cig, { z } from "@cigs/cigs";

const aiFunc = cig("ai-func", (config) => {
  config.setDescription(
    "You will a string of words respond with the most interesting word from them",
  );
  config.addExample("I love you so much!", "love");
  config.addExample("This food is delicious", "delicious");
  config.setModel("gpt-4o-2024-08-06");
  config.setLogLevel(1);
});

(async () => {
  try {
    const result = await aiFunc.run("What a wonderful day for a toboggan ride");
    console.log(result); // Toboggan
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

### Example: { Weather }

> [!TIP]
> Clone this repo and run this example with `npm run example:weather`

```ts
import cig, { z } from '@cigs/cigs';

const locationSchema = z.object({
  location: z.string(),
})

const userInfoSchema = z.object({
  username: z.string(),
})

const usernameSchema = z.object({
  usernames: z.array(z.string()),
})

async function fetchWeatherData(location: string): Promise<{ temperature: number; precipitation: number }> {
  const data = {
    'New York': { temperature: 20, precipitation: 10 },
    'London': { temperature: 15, precipitation: 5 },
    'Tokyo': { temperature: 25, precipitation: 20 },
  };
  return data[location as keyof typeof data];
}

const getWeatherData = cig("getWeatherData", locationSchema)
  //input will receive {location: ""}
  .handler(async (input) => {
    console.log("GetWeatherData", input, input.location);
    const data = await fetchWeatherData(input.location);
    return data;
  });

const getUserInfo = cig("getUserInfo", userInfoSchema)
  .handler(async (input) => {
    console.log("GetUserInfo", input);
    //Simulated user info retrieval
    const userInfo = {
      'john_doe': { name: 'John Doe', location: 'New York' },
      'jane_smith': { name: 'Jane Smith', location: 'London' },
      'alice_wong': { name: 'Alice Wong', location: 'Tokyo' },
    };
    return userInfo[input.username as keyof typeof userInfo] || { name: 'Unknown', location: 'Unknown' };
  });

const handleUsers = cig("handleUsers", usernameSchema, (config) => {
  config.setDescription("Handle weather notifications for users and create a nickname for each user");
  config.setModel("gpt-4o-2024-08-06");
  config.setLogLevel(1);
})
  .uses([getUserInfo, getWeatherData])
  .schema(z.object({
    numUsers: z.number(),
    userInfo: z.array(z.object({
      name: z.string(),
      location: z.string(),
      temperature: z.number(),
      precipitation: z.number(),
      nickname: z.string(),
    })),
  }));


// This can then be used like this
(async () => {
  try {
    const result = await handleUsers.run({
      usernames: ['john_doe', 'jane_smith', 'alice_wong']
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

```json
{
  "numUsers": 3,
  "userInfo": [
    {
      "name": "John Doe",
      "location": "New York",
      "temperature": 15,
      "precipitation": 5,
      "nickname": "Johnny"
    },
    {
      "name": "Jane Smith",
      "location": "London",
      "temperature": 10,
      "precipitation": 20,
      "nickname": "Janey"
    },
    {
      "name": "Alice Wong",
      "location": "Tokyo",
      "temperature": 20,
      "precipitation": 10,
      "nickname": "Al"
    }
  ]
}
```

### Common Patterns

#### Classification

> [!TIP]
> Clone this repo and run this example with `npm run example:classification`

```ts
import cig, { z } from "@cigs/cigs";

const sentimentInputSchema = z.object({
  text: z.string(),
});

const sentiment = cig("sentiment-analyzer", sentimentInputSchema, (config) => {
  config.setModel("gpt-4o-2024-08-06");
  config.setLogLevel(1);
})
  .classify(["positive", "negative", "neutral"], (config) => {
    config.addInstruction("Classify the sentiment of the input text");
    config.addExample("I love you!", "positive");
    config.addExample("I hate you!", "negative");
  });

(async () => {
  try {
    const result = await sentiment.run("I love you so much!");
    console.log(result); // 'positive'
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

#### Extraction

> [!TIP]
> Clone this repo and run this example with `npm run example:extraction`

```ts
const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.enum(["male", "female", "other"]),
  nickname: z.string().describe("a funny nickname for the person"),
});

const extract = cig("person-extractor", (config) => {
  config.setModel("gpt-4o-2024-08-06");
  config.setLogLevel(1);
  config.addInstruction(
    "Extract the person from the input text and make up a funny nickname for them",
  );
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
```

#### Generation

> [!TIP]
> Clone this repo and run this example with `npm run example:generation`

```ts
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
    const result2 = await generate.run("I want a list of rock albums");
    console.log(result); // { sentiment: 'positive' }
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

```json
[
  {
    "title": "Echoes of Reckoning",
    "artist": "The Thunder Rockers",
    "year": 1994,
    "numTracks": 12
  },
  {
    "title": "Electric Daze",
    "artist": "Sonic Vortex",
    "year": 2002,
    "numTracks": 14
  },
  {
    "title": "Crimson Highways",
    "artist": "Lunar Tides",
    "year": 1988,
    "numTracks": 10
  },
  {
    "title": "Fury & Flames",
    "artist": "Rogue Strikers",
    "year": 1979,
    "numTracks": 9
  },
  {
    "title": "Stone Symphony",
    "artist": "The Granite Hearts",
    "year": 2017,
    "numTracks": 11
  }
]
```

### Advanced Usage

cigs allows you to chain multiple operations for more complex workflows:

#### Chaining Operations

When chaining operations, the output of one operation is passed as input to the next. Each step is strongly typed based on the output of the previous step.

> [!TIP]
> Clone this repo and run this example with `npm run example:chaining`

```typescript
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

const chained = cig("album-generator-detail", albumInputSchema, (config) => {
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
  })
  .handler(async (input) => {
    console.log(input);
    return input.reduce((maxAlbum, currentAlbum) =>
      currentAlbum.numTracks > maxAlbum.numTracks ? currentAlbum : maxAlbum
    );
  })
  .schema(finalSchema, (config) => {
    config.addInstruction(
      "Generate a description for the album that had the most tracks",
    );
  });

(async () => {
  try {
    const result = await chained.run({ genre: "classical" });
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

```json
{
  title: 'Nocturnes of the Night',
  numTracks: 14,
  description: `"Nocturnes of the Night" is a captivating 2019 album by the acclaimed Pianist Lisette Von Brahm, featuring an evocative collection of 14 tracks. This album showcases Von Brahm's exquisite talent and emotional depth as she guides listeners through a series of nocturnes that paint the night with her delicate yet powerful touch on the piano. Each track is a journey through the nuances of nighttime moods, vividly captured through her artistic interpretation and technical prowess, making it a masterful contribution to contemporary piano music.`
}
```

#### Uses

This essentially is a easy way to use ChatGPT function calling / tools. You can
define cigs that use other cigs and pass them in as tools

> [!TIP]
> Clone this repo and run this example with `npm run example:uses`

```ts
const userInfoSchema = z.object({
  username: z.string(),
});

const colorSchema = z.object({
  color: z.string(),
});

// Define a cig to get a user's favorite color
const getFavoriteColor = cig("getFavoriteColor", userInfoSchema)
  .handler(async (input) => {
    // Simulated database lookup
    const colorMap = {
      "alice": "blue",
      "bob": "green",
      "charlie": "red",
    };
    return {
      color: colorMap[input.username as keyof typeof colorMap] || "unknown",
    };
  });

// Define a cig to get a compliment based on a color
const getColorCompliment = cig("getColorCompliment", colorSchema)
  .handler(async (input) => {
    // Simple color-based compliment generator
    const compliments = {
      "blue": "You have great taste!",
      "green": "Youre so in tune with nature!",
      "red": "Youre bold and confident!",
    };
    return {
      compliment: compliments[input.color as keyof typeof compliments] ||
        "Youre unique!",
    };
  });

// Define a cig that uses both getFavoriteColor and getColorCompliment
const getUserCompliment = cig("getUserCompliment", userInfoSchema)
  .uses([getFavoriteColor, getColorCompliment]);

// Usage example
(async () => {
  try {
    const result = await getUserCompliment.run({ username: "alice" }); // Alice's favorite color is blue, and her choice is complimented with: "You have great taste!"
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

## Vision and Future Direction

cigs aims to become a comprehensive framework for building Ai powered
applications. Our roadmap includes:

1. **Multi-provider support**: Integrate with various AI providers beyond OpenAI.
2. **Enhanced modality support**: Expand capabilities to handle image, audio, and video inputs.
3. **Complex interactions**: Develop tools for creating chatbots, autonomous agents, and multi-step reasoning systems.
4. **Deployment and monitoring**: Provide easy-to-use tools for deploying, managing, and monitoring cigs in production environments and seeing cost etc. Something like Firebase functions, Zapier, Replicate etc
5. **Performance optimization**: Implement caching, batching, and other performance enhancements. For example, after x amount of usage, instead of hitting openai api we can train a model on the usage and serve that.
6. **Community-driven development**: Foster an ecosystem of shared cigs that anyone can use.
7. What would you like to see?

## Todos

- [ ] Add a way to pass in a custom openai client
- [ ] Track cost
- [ ] Control the settings of the model better like temperature, top_p, etc

## Get in touch

💡 **Feature idea?** share it in [our Discord](https://discord.com/invite/Kgw4HpcuYG) 
🐛 **Found a bug?** feelfree to [open an issue](https://github.com/cigs-tech/cigs/issues/new/choose)

## Inspiration

- [instructor](https://github.com/jxnl/instructor)
- [askmarvin](https://www.askmarvin.ai)
- [fructose](https://github.com/bananaml/fructose)
- [wundergraph](https://github.com/wundergraph/wundergraph)

## License

cigs is licensed under the MIT license. See the LICENSE file for details.

---

🚬
