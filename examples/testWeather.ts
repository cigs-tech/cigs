// import cig, { z } from '@cigs/cigs';
import cig, { z } from "../src/index";
const locationSchema = z.object({
  location: z.string(),
});

const userInfoSchema = z.object({
  username: z.string(),
});

const usernameSchema = z.object({
  usernames: z.array(z.string()),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWeatherData(
  location: string,
): Promise<{ temperature: number; precipitation: number }> {
  await sleep(1000);
  const data = {
    "New York": { temperature: 20, precipitation: 10 },
    "London": { temperature: 15, precipitation: 5 },
    "Tokyo": { temperature: 25, precipitation: 20 },
  };
  return data[location as keyof typeof data];
}

const getWeatherData = cig("getWeatherData", locationSchema)
  .handler(async (input) => {
    console.log("GetWeatherData", input, input.location);
    const data = await fetchWeatherData(input.location);
    return data;
  });

const getUserInfo = cig("getUserInfo", userInfoSchema)
  .handler((input) => {
    console.log("GetUserInfo", input);
    const userInfo = {
      "john_doe": { name: "John Doe", location: "New York" },
      "jane_smith": { name: "Jane Smith", location: "London" },
      "alice_wong": { name: "Alice Wong", location: "Tokyo" },
    };
    return userInfo[input.username as keyof typeof userInfo] ||
      { name: "Unknown", location: "Unknown" };
  });

const handleUsers = cig("handleUsers", usernameSchema, (config) => {
  config.setDescription(
    "Handle weather notifications for users and create a nickname for each user",
  );
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
      usernames: ["john_doe", "jane_smith", "alice_wong"],
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
})();
