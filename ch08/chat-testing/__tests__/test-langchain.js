import { FakeLLM, FakeRunnable, FakeRetriever } from '@langchain/core/utils/testing';
import { RAGSystem } from '../src/rag';

describe('Testing with FakeLLM', () => {
  it('should return a predefined response from the FakeLLM', async () => {
    const mockResponse = 'This is a test response.';
    const fakeLLM = new FakeLLM({
      response: mockResponse,
    });

    const result = await fakeLLM._call('What is the test response?');
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error when instructed', async () => {
    const errorMessage = 'This is an error message.';
    
    const fakeLLM = new FakeLLM({
      thrownErrorString: errorMessage,
    });

    await expect(fakeLLM._call('What will happen?')).rejects.toThrow(errorMessage);
  });
});

describe('Testing with FakeRunnable', () => {
  it('should return input as output', async () => {
    const fakeRunnable = new FakeRunnable({ returnOptions: false });

    const input = 'Test input';
    const result = await fakeRunnable.invoke(input);

    expect(result).toEqual({ input });
  });

  it('should return options when requested', async () => {
    const options = { option1: true, option2: 'value' };
    
    const fakeRunnable = new FakeRunnable({ returnOptions: true });

    const result = await fakeRunnable.invoke('Some input', options);

    expect(result).toEqual(options);
  });
});

describe('RAGSystem', () => {
  let ragSystem;

  beforeEach(() => {
    const apiKey = 'test_api_key';
    ragSystem = new RAGSystem(apiKey);

    const retriever = new FakeRetriever({
      output: [
        { pageContent: 'This is some context about AI.' },
        { pageContent: 'This is another context about machine learning.' },
      ],
    });

    const llm = new FakeLLM({
      response: 'The answer based on the provided context.',
    });

    ragSystem.retriever = retriever;
    ragSystem.llm = llm;
  });

  it('should throw an error if retriever is not initialized', async () => {
    ragSystem.retriever = null;

    await expect(ragSystem.performRAG('What is AI?')).rejects.toThrow('Retriever not initialized. Run indexDocuments first.');
  });

  it('should return an answer and source documents', async () => {
    const query = 'What is AI?';

    const result = await ragSystem.performRAG(query);

    expect(result.answer).toEqual('The answer based on the provided context.');
    expect(result.sourceDocuments).toEqual([
      { pageContent: 'This is some context about AI.' },
      { pageContent: 'This is another context about machine learning.' },
    ]);
  });
});