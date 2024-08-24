import cig, { z } from '../src/index';

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