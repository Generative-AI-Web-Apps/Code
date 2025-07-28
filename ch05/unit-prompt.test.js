

import { vi, expect, test } from "vitest";
vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

import { generateText } from "ai";
import stringComparison from 'string-comparison'

function semanticSimilarity(text1, text2) {
  let cos = stringComparison.cosine
  return cos.similarity(text1, text2);
}

test("generated text is semantically similar to expected output", async () => {
  generateText.mockResolvedValue(
    "AI greatly influences modern life in many ways."
  );

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
 generateText.mockResolvedValue({
  text: "Regular exercise significantly improves health and fitness by boosting energy, enhancing mood, and reducing the risk of many chronic diseases."
});

  const { text } = await generateText({
    model: "fakeModel",
    prompt:
      "Summarize the benefits of exercise in 20-30 words. Include 'health' and 'fitness'.",
  });

  console.log("Word count:", text.split(/\s+/).length);
  expect(validateConstraints(text, 20, 30, ["health", "fitness"])).toBe(true);
});
