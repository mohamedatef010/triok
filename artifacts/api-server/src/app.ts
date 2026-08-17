import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const isProduction = process.env.NODE_ENV === "production";
const app: Express = express();

// Trust the first proxy (Nginx) — required for express-rate-limit and IP detection behind reverse proxy
app.set("trust proxy", 1);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
        mediaSrc: ["'self'", "blob:", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
        frameSrc: ["'self'", "https://yookassa.ru", "https://*.yookassa.ru"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  })
);

app.use(cookieParser());

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
  })
);

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL.replace(/\/$/, ""), "https://xn----7sb1acdcpkxafxk9g.xn--p1ai", "http://localhost:5173", "http://localhost:3000"]
  : true;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!isProduction || !origin) {
      callback(null, true);
      return;
    }
    if (Array.isArray(allowedOrigins)) {
      const isAllowed = allowedOrigins.some((allowed) => allowed === origin || allowed === "*");
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Main API routes
app.use("/api", router);

// Global Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, method: req.method, url: req.url }, "Unhandled server error");

  const statusCode = typeof err.status === "number" ? err.status : 500;
  const message = isProduction
    ? "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже."
    : err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
  });
});

export default app;

