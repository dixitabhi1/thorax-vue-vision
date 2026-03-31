import { port } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(port, () => {
  console.log(`Thorax proxy server listening on http://localhost:${port}`);
});
