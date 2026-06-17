import rateLimit from "express-rate-limit";

/** Global: 300 req / 15 min per IP — protects all /api endpoints */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em 15 minutos." },
  skip: (req) => req.path.includes("/health"),
});

/** Auth: 10 req / 15 min per IP — hard cap on login/logout attempts */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Muitas tentativas de acesso. Tente novamente em 15 minutos." },
});
