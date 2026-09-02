import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";
import { globalLimiter } from "./lib/rateLimiters";

const PgStore = connectPgSimple(session);

const app: Express = express();

/* ─── Trust proxy ────────────────────────────────────────── */
// Replit reverse-proxies all traffic; required for secure cookies + correct IP in rate limiter.
app.set("trust proxy", 1);

/* ─── Request logging ────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

/* ─── Security headers (Helmet) ──────────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: false,     // API serves JSON, not HTML
    crossOriginEmbedderPolicy: false, // Not needed for JSON API
    crossOriginOpenerPolicy: false,   // Not needed for JSON API
    // Enabled by default: X-Content-Type-Options, X-Frame-Options, X-DNS-Prefetch-Control,
    // Strict-Transport-Security, X-Download-Options, X-Permitted-Cross-Domain-Policies,
    // Referrer-Policy, X-XSS-Protection
  }),
);

/* ─── CORS ───────────────────────────────────────────────── */
// Allow only known origins in dev/prod to avoid cross-site credential leakage.
const allowedCorsOrigins = new Set(
  (process.env.CORS_ORIGINS ?? "http://localhost:25625,http://127.0.0.1:25625")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedCorsOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);

/* ─── Rate limiting ──────────────────────────────────────── */
// Global: 300 req / 15 min per IP (defined in lib/rateLimiters.ts to avoid circular deps)
app.use(globalLimiter);

/* ─── Body parsers (with size limits) ───────────────────── */
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

/* ─── Session ────────────────────────────────────────────── */
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
      // Prune expired sessions every hour
      pruneSessionInterval: 60 * 60,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "cst.sid", // Rename from default "connect.sid" — obscures server technology
    cookie: {
      secure: process.env.NODE_ENV === "production" || process.env.REPL_ID !== undefined,
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" || process.env.REPL_ID !== undefined ? "none" : "lax",
    },
  }),
);

/* ─── Routes ─────────────────────────────────────────────── */
app.use("/api", router);

/* ─── Global error handler ───────────────────────────────── */
// Catches unhandled errors from async route handlers — prevents stack trace leakage.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // Log full error internally but never expose details to the client
  req.log?.error({ err }, "Unhandled error");
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
