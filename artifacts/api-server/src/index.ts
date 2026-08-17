import { config } from "dotenv";
config(); // Load .env from the current working directory (artifacts/api-server/)

import app from "./app";
import { logger } from "./lib/logger";
import { ensureBucketExists } from "@workspace/storage";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Automatically ensure storage bucket exists
ensureBucketExists().catch((err) => {
  logger.warn({ err }, "Initial bucket check completed with notice");
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

