import "./env";
import { createApp } from "./server/app";

const port = Number(process.env.API_PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`@prode/api listening on http://localhost:${port}`);
});
