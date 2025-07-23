import { createServer } from './server.openai.js';

const app = createServer();
app.listen(3000, () => {
  console.log('Server has started!');
});
