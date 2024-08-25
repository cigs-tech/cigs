import cig, { z } from "../src/index";

const userInfoSchema = z.object({
  username: z.string(),
});

const colorSchema = z.object({
  color: z.string(),
});

// Define a cig to get a user's favorite color
const getFavoriteColor = cig("getFavoriteColor", userInfoSchema)
  .handler((input) => {
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
  .handler((input) => {
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
    // Expected output: { username: 'alice', favoriteColor: 'blue', compliment: 'You have great taste!' }
  } catch (error) {
    console.error("Error:", error);
  }
})();
