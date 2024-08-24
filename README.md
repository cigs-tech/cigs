# cigs - Ai functions for Typescript

![GitHub top language](https://img.shields.io/github/languages/top/cigs-tech/cigs)
[![npm version](https://img.shields.io/npm/v/@typeai/core)](https://www.npmjs.com/package/@typeai/core)
[![CI](https://github.com/TypeAI-dev/typeai/actions/workflows/ci.yml/badge.svg)](https://github.com/TypeAI-dev/typeai/actions/workflows/ci.yml)
[![GitHub license](https://img.shields.io/github/license/TypeAI-dev/typeai)](https://github.com/TypeAI-dev/typeai/blob/main/LICENSE.txt)
[![Twitter Follow](https://img.shields.io/twitter/follow/Jonovono?style=social)](https://twitter.com/Jonovono)

My mom calls it lodash for making ai functions. Others call it graphql for functions. Anyways, cigs are composable intelligent generative snippets that give you new ways to build powerful apps making use of the latest in ai

![cigs](https://i.imgur.com/QvJerh0.png)

> [!CAUTION]
> This library is still under development, I will be erring on the side of speed
> Please join the Discord if you need help or something is broken

## What cigs does:

* Execute TypeScript methods using natural language inputs
* Chain multiple Ai functions to create complex workflows
* Provide helper functions for common tasks like classification, extraction, tool execution, and generation
* Ensure type safety and structured outputs with Zod schemas
* Call functions and get a specified response schema back

Sounds weird, but with some examples it might make more sense

## Installation

```bash
# Trying out jsr, I hate tsconfig and all that
# If anyone reallys it as a npm package, let me know

# npm
npx jsr add @cigs/cigs

# deno
deno add @cigs/cigs
```

## Usage

### Call a typescript function with natural language

> [!TIP]
> Clone this repo and run this example with `npm run example:handler`

cigs wants to do a lot, but I think something cool about it is you can call a typescript function with natural language

Super simple example, but say you have this function:

```ts
function getUserCompliment(username: string) {
  const colorMap = {
    'Alice': 'blue',
    'Bob': 'green',
    'Charlie': 'red'
  };
  return { color: colorMap[input.username as keyof typeof colorMap] || 'unknown' };
}
```

You can call this function with natural language like this:

```ts
const userInfoSchema = z.object({
  username: z.string()
})

// Define a cig to get a user's favorite color
const getFavoriteColor = cig("getFavoriteColor", userInfoSchema)
  .handler(async (input) => {
    // Simulated database lookup
    return getUserCompliment(input.username);
  });

// Usage example
(async () => {
  try {
    const result = await getFavoriteColor.run("What is the favorite color of Alice"); // { color: 'blue' }
    console.log(result);

    const result2 = await getFavoriteColor.run("What is the favorite color of Susan"); // { color: 'unknown' }
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

### Quick Start { simple }

> [!TIP]
> Clone this repo and run this example with `npm run example:simple`

```ts
import cig, { z } from '@cigs/cigs';

const aiFunc = cig("ai-func", (config) => {
  config.setDescription("You will a string of words respond with the most interesting word from them")
  config.addExample("I love you so much!", "love")
  config.addExample("This food is delicious", "delicious")
  config.setModel('gpt-4o-2024-08-06');
  config.setLogLevel(1)
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
  #  input will receive {location: ""}
  .handler(async (input) => {
    console.log("GetWeatherData", input, input.location);
    const data = await fetchWeatherData(input.location);
    return data;
  });

const getUserInfo = cig("getUserInfo", userInfoSchema)
  .handler(async (input) => {
    console.log("GetUserInfo", input);
    # Simulated user info retrieval
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
import cig, { z } from '@cigs/cigs';

const sentimentInputSchema = z.object({
  text: z.string()
})

const sentiment = cig("sentiment-analyzer", sentimentInputSchema, (config) => {
  config.setModel('gpt-4o-2024-08-06');
  config.setLogLevel(1);
})
  .classify(['positive', 'negative', 'neutral'], (config) => {
    config.addInstruction('Classify the sentiment of the input text');
    config.addExample("I love you!", 'positive');
    config.addExample("I hate you!", 'negative');
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
```

#### Generation

> [!TIP]
> Clone this repo and run this example with `npm run example:generation`

```ts
const albumInputSchema = z.object({
  genre: z.string()
})

const albumSchema = z.object({
  title: z.string(),
  artist: z.string(),
  year: z.number(),
  numTracks: z.number(),
})

const generate = cig("album-generator", albumInputSchema, (config) => {
  config.setModel('gpt-4o-2024-08-06');
  config.setLogLevel(1);
  config.addInstruction('Generate a list of fake albums that sound like they would be for a given genre');
})
  .generate(albumSchema, 5, (config) => {
    config.addInstruction('Generate a list of fake albums that sound like they would be for a given genre');
  });

(async () => {
  try {
    const result = await generate.run({ genre: 'rock' });
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
    title: 'Echoes of Reckoning',
    artist: 'The Thunder Rockers',
    year: 1994,
    numTracks: 12
  },
  {
    title: 'Electric Daze',
    artist: 'Sonic Vortex',
    year: 2002,
    numTracks: 14
  },
  {
    title: 'Crimson Highways',
    artist: 'Lunar Tides',
    year: 1988,
    numTracks: 10
  },
  {
    title: 'Fury & Flames',
    artist: 'Rogue Strikers',
    year: 1979,
    numTracks: 9
  },
  {
    title: 'Stone Symphony',
    artist: 'The Granite Hearts',
    year: 2017,
    numTracks: 11
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

const chained = cig("album-generator-detail", albumInputSchema, (config) => {
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
```

```json
{
  title: 'Nocturnes of the Night',
  numTracks: 14,
  description: `"Nocturnes of the Night" is a captivating 2019 album by the acclaimed Pianist Lisette Von Brahm, featuring an evocative collection of 14 tracks. This album showcases Von Brahm's exquisite talent and emotional depth as she guides listeners through a series of nocturnes that paint the night with her delicate yet powerful touch on the piano. Each track is a journey through the nuances of nighttime moods, vividly captured through her artistic interpretation and technical prowess, making it a masterful contribution to contemporary piano music.`
}
```

#### Uses

This essentially is a easy way to use ChatGPT function calling / tools. You can define cigs that use other cigs and pass them in as tools

> [!TIP]
> Clone this repo and run this example with `npm run example:uses`

```ts
const userInfoSchema = z.object({
  username: z.string()
})

const colorSchema = z.object({
  color: z.string()
})

// Define a cig to get a user's favorite color
const getFavoriteColor = cig("getFavoriteColor", userInfoSchema)
  .handler(async (input) => {
    // Simulated database lookup
    const colorMap = {
      'alice': 'blue',
      'bob': 'green',
      'charlie': 'red'
    };
    return { color: colorMap[input.username as keyof typeof colorMap] || 'unknown' };
  });

// Define a cig to get a compliment based on a color
const getColorCompliment = cig("getColorCompliment", colorSchema)
  .handler(async (input) => {
    // Simple color-based compliment generator
    const compliments = {
      'blue': 'You have great taste!',
      'green': 'Youre so in tune with nature!',
      'red': 'Youre bold and confident!'
    };
    return {
      compliment: compliments[input.color as keyof typeof compliments] || 'Youre unique!'
    };
  });

// Define a cig that uses both getFavoriteColor and getColorCompliment
const getUserCompliment = cig("getUserCompliment", userInfoSchema)
  .uses([getFavoriteColor, getColorCompliment]);

// Usage example
(async () => {
  try {
    const result = await getUserCompliment.run({ username: 'alice' }); // Alice's favorite color is blue, and her choice is complimented with: "You have great taste!"
    console.log(result);
    // Expected output: { username: 'alice', favoriteColor: 'blue', compliment: 'You have great taste!' }
  } catch (error) {
    console.error("Error:", error);
  }
})();
```

## Vision and Future Direction

cigs aims to become a comprehensive framework for building Ai powered applications. Our roadmap includes:

1. Multi-provider support: Integrate with various AI providers beyond OpenAI.
2. Enhanced modality support: Expand capabilities to handle image, audio, and video inputs.
3. Complex interactions: Develop tools for creating chatbots, autonomous agents, and multi-step reasoning systems.
4. Deployment and monitoring: Provide easy-to-use tools for deploying, managing, and monitoring cigs in production environments.
5. Performance optimization: Implement caching, batching, and other performance enhancements. For example, after x amount of usage, instead of hitting openai api we can train a model on the usage and serve that.
6. Community-driven development: Foster an ecosystem of shared cigs that anyone can use.
7. What would you like to see?

## Get in touch

💡 **Feature idea?** share it in [our Discord](https://discord.com/invite/Kgw4HpcuYG).
🐛 **Found a bug?** feel free to [open an issue](https://github.com/cigs-tech/cigs/issues/new/choose).

## Inspiration

* [instructor](https://github.com/jxnl/instructor)
* [askmarvin](https://www.askmarvin.ai)
* [fructose](https://github.com/bananaml/fructose)
* [wundergraph](https://github.com/wundergraph/wundergraph)

## License

cigs is licensed under the MIT license. See the LICENSE file for details.

---

🚬