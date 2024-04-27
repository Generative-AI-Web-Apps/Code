// // Import necessary modules
// import OpenAI from 'openai';
// import express from 'express';
// // Load environment variables from .env file
// import 'dotenv/config';
// const apiKey = process.env.OPENAI_API_KEY;
// import { Readable } from 'stream';

// // Check if API key exists
// if (!apiKey) {
//     throw new Error('Missing OPENAI_API_KEY environment variable');
// }

// // Initialize OpenAI client and Express app
// const openai = new OpenAI({ apiKey });
// const app = express();

// // Parse request body as text
// app.use(express.text());

// const fakeStream = {
//     readable: true,
//     toReadableStream() {
//         return new Readable({
//             read() {
//                 // Simulate receiving chunks of data
//                 this.push('This is a fake chunk from the stream\n');
//                 this.push(null); // Signal end of stream
//             },
//         });
//     },
// };

// class OpenAIHandler {
//     constructor(openai) { this.openai = openai; }

//     async handleRequest(req, res) {
//         try {
//             console.log('Received request:', req.body);

//             // Call the template method (abstract) to delegate completion generation
//             const stream = await this.getCompletionStream(req.body);

//             res.header('Content-Type', 'text/plain');
//             for await (const chunk of stream) { // Assuming the stream is iterable
//                 res.write(chunk);
//             }
//             res.end();
//         } catch (e) {
//             console.error(e);
//             res.status(500).send('Internal server error');
//         }
//     }

//     // Template method (abstract) - defines the core logic but delegates completion generation
//     async getCompletionStream(text) {
//         throw new Error('getCompletionStream not implemented');
//     }
// }

// // Concrete OpenAI provider using the actual OpenAI library (assuming you have a library)
// class OpenAIProvider extends OpenAIHandler {
//     constructor(openai) { super(openai) }

//     async getCompletionStream(text) {
//         const options = {
//             model: 'gpt-3.5-turbo',
//             stream: true,
//             messages: [{ role: 'user', content: text }],
//         }
//         // Use the OpenAI library to get the stream
//         console.debug(this)
//         return this.openai.beta.chat.completions.stream(options);
//     }
// }

// // (Optional) Mock OpenAI provider for testing
// class MockOpenAIProvider {
//     async getCompletionStream(options) {
//         return fakeStream;
//     }
// }

// // Choose the provider based on environment or configuration
// const openaiProvider = process.env.NODE_ENV === 'test' ? new MockOpenAIProvider() : new OpenAIProvider(openai);
// app.post('/', (req, res) => openaiProvider.handleRequest(req, res));

// // Start the server on port 3000
// app.listen(3000, () => {
//     console.log('Started proxy express server');
// });

// Import necessary modules
import OpenAI from "openai";
import express from "express";
import cors from "cors";
// Load environment variables from .env file
import "dotenv/config";
const apiKey = process.env.OPENAI_API_KEY;

// Check if API key exists
if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class OpenAIHandler {
  constructor(openai) {
    this.openai = openai;
  }

  async handleRequest(req, res) {
    try {
      console.log("Received request:", req.body);
      await sleep(4000);
      const { text } = req.body;
      const { data: completion } = await this.openai.chat.completions
        .create({
          messages: [
            {
              role: "system",
              content:
                "I'm happy to assist you in any way I can. How can I be of service today?",
            },
            { role: "user", content: text },
          ],
          model: "gpt-3.5-turbo",
          stop: null, // Remove stop sequences for chat-like responses
          max_tokens: 150,
        })
        .withResponse();
      const message = {
        id: completion.id, // Include ID
        created: completion.created,
        role: "assistant",
        content: completion.choices[0].message.content, // Extract content from message
      };
      res.json({ message });
    } catch (e) {
      console.error(e);
      res.status(500).send("Internal server error");
    }
  }
}

export function createServer() {
  // Initialize OpenAI client and Express app
  const openai = new OpenAI({ apiKey });
  const app = express();

  // Parse request body as json
  app.use(express.json());
  app.use(
    cors({
      origin: "http://localhost:5173",
    })
  );
  const openaiProvider = new OpenAIHandler(openai);
  app.post("/", (req, res) => openaiProvider.handleRequest(req, res));
  return app;
}
