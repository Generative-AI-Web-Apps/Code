import "dotenv/config";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY environment variable");
}

const model = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
});

async function generateProgrammingLanguages() {
  const prompt = `
List some popular programming languages along with a brief description of each:

1. JavaScript: A versatile language primarily used for web development.
2. Python: Known for its readability and used in data science and web development.
3. Java: A widely-used language for building enterprise-level applications.

4.`;

  const response = await generateText({
    model: model("models/gemini-2.0-flash"),
    prompt: prompt,
    maxTokens: 512,
  });

  console.log("Generated Programming Languages:", response.text);
}

async function supportCustomerIssue(message) {
  const system = `
You are a customer support chatbot. Adapt your tone and sentiment based on the following example interactions for each supported use case:

**Use Case 1: Technical Support**

**User:** My internet connection is really slow. Can you help me?

**Chatbot:** I'm sorry to hear that you're experiencing slow internet speeds. Let's troubleshoot this together. Can you please provide me with your current speed test results?

**Use Case 2: Billing Inquiry**

**User:** I was charged twice for my subscription this month. What happened?

**Chatbot:** I understand how concerning double charges can be. Let me check your account details and resolve this issue for you right away.

**Use Case 3: General Inquiry**

**User:** What are your customer support hours?

**Chatbot:** Our customer support team is available 24/7 to assist you with any questions you may have.
`;

  const response = await generateText({
    model: model("models/gemini-2.0-flash"),
    prompt: message,
    system: system,
    maxTokens: 512,
  });

  console.log("Chatbot Responses:", response.text);
}

await generateProgrammingLanguages();

await supportCustomerIssue("My Wi-Fi keeps disconnecting every few minutes. What should I do?");
await supportCustomerIssue("I was charged for a service I didn't use. Can you help?");
await supportCustomerIssue("Can I change my shipping address after placing an order?");
await supportCustomerIssue("I'm locked out of my account. How can I regain access?");