import { PromptTemplate, FewShotPromptTemplate } from '@langchain/core/prompts';
const examples = [
  {
    question: 'What is the primary ingredient in sushi?',
    answer: `
Are follow-up questions needed here: No.
So the final answer is: Rice.
    `,
  },
  {
    question: 'Who was the first person to walk on the moon?',
    answer: `
Are follow-up questions needed here: No.
So the final answer is: Neil Armstrong.
    `,
  },
  {
    question: 'What is the fastest land animal?',
    answer: `
Are follow-up questions needed here: No.
So the final answer is: Cheetah.
    `,
  },
  {
    question: 'What gas do plants primarily use for photosynthesis?',
    answer: `
Are follow-up questions needed here: Yes.
Follow-up: What process do plants perform?
Intermediate answer: Plants primarily use carbon dioxide for photosynthesis.
So the final answer is: Carbon dioxide.
    `,
  },
];

const examplePrompt = PromptTemplate.fromTemplate('Question: {question}\nAnswer: {answer}');
const prefix = `You are an intelligent assistant designed to answer questions accurately and concisely. Below are some examples of how to approach different types of questions. Pay attention to whether follow-up questions are needed and how the final answer is presented. After reviewing these examples, please answer the user's question in a similar format.

Remember:
1. Determine if follow-up questions are needed.
2. If yes, ask the follow-up and provide an intermediate answer.
3. Always conclude with a final answer.

Here are some examples:`;

export const prompt = new FewShotPromptTemplate({
  examples,
  examplePrompt,
  prefix,
  suffix: 'Question: {input}',
  inputVariables: ['input'],
});
