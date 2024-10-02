import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const supportedProviders = {
  openai: {
    constructor: createOpenAI,
    models: ['gpt-3.5-turbo', 'gpt-4'],
  },
  google: {
    constructor: createGoogleGenerativeAI,
    models: ['models/gemini-1.5-pro-latest'],
  },
};

export function getSupportedModel(provider, model) {
  const providerConfig = supportedProviders[provider];

  if (!providerConfig) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const { constructor, models } = providerConfig;

  if (!models.includes(model)) {
    throw new Error(`Unsupported model: ${model} for provider: ${provider}`);
  }

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

  if (!apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  const providerInstance = constructor({ apiKey });

  return providerInstance(model);
}
