import cig, { z } from "../src/index";

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
    console.log(result); // { sentiment: 'positive' }
  } catch (error) {
    console.error("Error:", error);
  }
})();
