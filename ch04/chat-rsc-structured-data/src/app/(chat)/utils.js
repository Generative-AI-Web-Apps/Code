import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const supportedProviders = {
  openai: {
    constructor: createOpenAI,
    models: ['gpt-3.5-turbo', 'gpt-4'],
  },
  gemini: {
    constructor: createGoogleGenerativeAI,
    models: ['models/gemini-2.5-flash'],
  },
};

export function getSupportedModel(provider, model) {
  const providerConfig = supportedProviders[provider];

  if (!providerConfig) {
    throw new Error(`Unsupported provider: ${provider}. Please check your configuration.`);
  }

  const { constructor, models } = providerConfig;

  if (!models.includes(model)) {
    throw new Error(`Unsupported model: ${model} for provider: ${provider}. Please choose a supported model.`);
  }

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

  if (!apiKey) {
    const keyName = `${provider.toUpperCase()}_API_KEY`;
    throw new Error(
      `Missing API key for provider: ${provider}. ` +
      `Please ensure the '${keyName}' environment variable is set in your '.env' file. ` +
      `If running from a monorepo, confirm the '.env' file is in the project root ` +
      `or the specific workspace folder (e.g., 'ch04/chat-rsc-structured-data'). ` +
      `Refer to Appendix A for detailed API key setup instructions.`
    );
  }

  const providerInstance = constructor({ apiKey });

  return providerInstance(model);
}