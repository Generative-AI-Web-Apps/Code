// Import necessary modules
import OpenAI from 'openai';
import express from 'express';
import cors from 'cors';
import winston from 'winston';
// Load environment variables from .env file
import 'dotenv/config';
const apiKey = process.env.OPENAI_API_KEY;

// Check if API key exists
if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.simple() })],
});

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
      logger.info('Received request:', { body: req.body });
      await sleep(4000);
      const { text } = req.body;
      const { data: completion } = await this.openai.chat.completions
        .create({
          messages: [
            {
              role: 'system',
              content: "I'm happy to assist you in any way I can. How can I be of service today?",
            },
            { role: 'user', content: text },
          ],
          model: 'gpt-3.5-turbo',
          stop: null,
          max_tokens: 150,
        })
        .withResponse();
      const message = {
        id: completion.id, // Include ID
        created: completion.created,
        role: 'assistant',
        content: completion.choices[0].message.content, // Extract content from message
      };
      res.json({ message });
    } catch (e) {
      logger.error('Internal server error:', { error: e.message });
      res.status(500).send('Internal server error');
    }
  }
}

export function createServer() {
  const openai = new OpenAI({ apiKey });
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.options('*', cors());
  const openaiProvider = new OpenAIHandler(openai);
  app.post('/', (req, res) => openaiProvider.handleRequest(req, res));
  // Global error-handling middleware
  app.use((err, req, res, next) => {
    logger.error('Unhandled error:', { error: err.message, stack: err.stack });
    res.status(500).send('Internal server error');
  });
  return app;
}
