import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to prevent breaking ReactPlayer/Vite/S3
}));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? (process.env.FRONTEND_URL || false) // In production, must be explicitly set, else block
    : true, // In development, allow local frontend origins
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.use("/api", router);

export default app;
