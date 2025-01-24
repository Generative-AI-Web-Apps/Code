import { continueConversation } from './actions';
import { getSupportedModel } from './utils';
import { MockLanguageModelV1 } from 'ai/test';

jest.mock('./utils', () => ({
  getSupportedModel: jest.fn(),
}));

describe('continueConversation', () => {
  it('should return an instance of MockLanguageModelV1 when called', async () => {
    const history = [{ role: 'user', content: 'Hello!' }];
    const provider = 'someProvider';
    const model = 'someModel';

    const mockInstance = new MockLanguageModelV1();
    getSupportedModel.mockReturnValue(mockInstance);

    const response = await continueConversation(history, provider, model);

    expect(getSupportedModel).toHaveBeenCalledWith(provider, model);
    expect(response.messages).toEqual(history);
    expect(response.newMessage).toBe(mockInstance.someExpectedOutput);
  });
});
