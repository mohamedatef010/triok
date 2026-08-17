import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests (login, register) per 15 minutes
  message: { error: "Слишком много попыток входа или регистрации. Пожалуйста, повторите позже (через 15 минут)." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 refresh requests per 15 minutes
  message: { error: "Слишком много запросов обновления сессии. Пожалуйста, повторите позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentInitiateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 payment initiation requests per windowMs
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

