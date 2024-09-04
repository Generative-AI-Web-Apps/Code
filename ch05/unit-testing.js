import { cosineSimilarity } from "string-similarity-js";

function semanticSimilarity(text1, text2) {
  return cosineSimilarity(text1, text2);
}

test("generated text is semantically similar to expected output", async () => {
  const expected = "AI has a significant impact on modern society.";
  const generated = await generateText(
    "Describe the role of AI in today's world."
  );

  const similarity = semanticSimilarity(expected, generated);
  expect(similarity).toBeGreaterThan(0.7);
});

function validateConstraints(text, minWords, maxWords, requiredWords) {
  const words = text.split(/\s+/);
  return (
    words.length >= minWords &&
    words.length <= maxWords &&
    requiredWords.every((word) =>
      text.toLowerCase().includes(word.toLowerCase())
    )
  );
}

test("generated text meets constraints", async () => {
  const { text } = await generateText({
    model: yourModel,
    prompt:
      "Summarize the benefits of exercise in 20-30 words. Include 'health' and 'fitness'.",
  });
  expect(validateConstraints(text, 20, 30, ["health", "fitness"])).toBe(true);
});
