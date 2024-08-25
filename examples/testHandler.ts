import cig, { z } from "../src/index";

const userInfoSchema = z.object({
  username: z.string(),
});

// Define a cig to get a user's favorite color
const getFavoriteColor = cig("getFavoriteColor", userInfoSchema)
  .handler((input) => {
    // Simulated database lookup
    const colorMap = {
      "Alice": "blue",
      "Bob": "green",
      "Charlie": "red",
    };
    return {
      color: colorMap[input.username as keyof typeof colorMap] || "unknown",
    };
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
