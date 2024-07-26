import { createStreamableUI } from "@vercel/ai-sdk";

export async function continueConversation(history) {
  const ui = createStreamableUI();
  ui.update(<p>Starting process...</p>);
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ui.append(<p>Step 1 complete</p>);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ui.append(<p>Step 2 complete</p>);
    ui.update(<p>Process complete!</p>);
    ui.done();
  } catch (error) {
    ui.error(error);
  }

  return ui;
}
