import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "fratelanza-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

const PUBLIC_PATHS = ["/api/auth/login", "/api/healthz"];

app.use((req: Request, res: Response, next: NextFunction) => {
  if (PUBLIC_PATHS.some(p => req.path.startsWith(p))) return next();
  if (req.path.startsWith("/api/") && !(req.session as any).userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

app.use("/api", router);

if (process.env.STATIC_DIR) {
  const staticDir = process.env.STATIC_DIR;
  app.use(express.static(staticDir));
  app.get("/{*splat}", (_req, res) => { res.sendFile(path.join(staticDir, "index.html")); });
}

export default app;
