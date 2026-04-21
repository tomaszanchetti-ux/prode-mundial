import "./env";
import { createApp } from "./server/app";

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`@prode/api listening on port ${port}`);
});
