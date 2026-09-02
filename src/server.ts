import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(
    `Email Campaign API running on http://localhost:${env.port}`,
  );
});