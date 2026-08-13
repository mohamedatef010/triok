import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { error: "Слишком много попыток, пожалуйста, повторите позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentInitiateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 payment initiation requests per windowMs
  message: { error: "Слишком много запросов на оплату, пожалуйста, повторите позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const videoViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 view counts per windowMs
  message: { error: "Слишком много запросов." },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});
