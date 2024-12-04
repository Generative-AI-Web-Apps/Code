import {
    DynamicRetrievalMode,
    GoogleGenerativeAI,
  } from "@google/generative-ai";
  import "dotenv/config";
const apiKey = process.env.GOOGLE_API_KEY;
  
  async function searchGrounding() {
    // [START search_grounding]
    // Make sure to include these imports:
    // import {
    //  DynamicRetrievalMode,
    //  GoogleGenerativeAI,
    // } from "@google/generative-ai";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      {
        model: "gemini-1.5-pro",
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: DynamicRetrievalMode.MODE_DYNAMIC,
                dynamicThreshold: 0.7,
              },
            },
          },
        ],
      },
      { apiVersion: "v1beta" },
    );
  
    const prompt = "What is the price of Google stock today?";
    const result = await model.generateContent(prompt);
    console.log(result.response.candidates[0].groundingMetadata);
    // [END search_grounding]
  }
  async function runAll() {
    // Comment out or delete any sample cases you don't want to run.
    await searchGrounding();
  }
  
  runAll();