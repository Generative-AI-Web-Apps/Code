import { generateText, generateObject, simulateReadableStream, streamText } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';
import { z } from 'zod';

describe('Text Generation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });
  test('should return predefined text from mock model', async () => {
    const result = await generateText({
      model: new MockLanguageModelV1({
        doGenerate: async () => ({
          rawCall: { rawPrompt: null, rawSettings: {} },
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 20 },
          text: `Hello, world!`,
        }),
      }),
      prompt: 'Hello, test!',
    });

    expect(result.text).toBe('Hello, world!');
  });
  test('should return a predefined object from mock model', async () => {
    const result = await generateObject({
      model: new MockLanguageModelV1({
        defaultObjectGenerationMode: 'json',
        doGenerate: async () => ({
          rawCall: { rawPrompt: null, rawSettings: {} },
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 20 },
          text: `{"content":"Hello, world!"}`,
        }),
      }),
      schema: z.object({ content: z.string() }),
      prompt: 'Hello, test!',
    });

    expect(result.object).toEqual({ content: 'Hello, world!' });
  });
});

describe('Streaming Functionality Tests', () => {
  test('should stream text in chunks correctly', async () => {
    const result = streamText({
      model: new MockLanguageModelV1({
        doStream: async () => ({
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-delta', textDelta: 'This is ' },
              { type: 'text-delta', textDelta: 'a test ' },
              { type: 'text-delta', textDelta: 'of streaming.' },
              {
                type: 'finish',
                finishReason: 'stop',
                logprobs: undefined,
                usage: { completionTokens: 15, promptTokens: 5 },
              },
            ],
          }),
          rawCall: { rawPrompt: null, rawSettings: {} },
        }),
      }),
      prompt: 'Start streaming!',
    });

    const streamedTexts = [];
    for await (const text of result.textStream) {
      streamedTexts.push(text);
    }

    expect(streamedTexts.join('')).toBe('This is a test of streaming.');
  });
});
