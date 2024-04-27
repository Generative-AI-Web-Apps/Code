import { createServer } from './server.js';

const app = createServer();
app.listen(3000, () => {
  console.log('Server has started!');
});
