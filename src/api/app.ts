import { TestSessionStatus } from "@prisma/client";
import { timingSafeEqual } from "node:crypto";
import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pino from "pino";
import { z } from "zod";
import { REGIONS, GLOBAL_TIERS } from "../domain/tiers.js";
import { prisma } from "../db/prisma.js";
import { ServiceError } from "../services/errors.js";
import {
  completeTestSession,
  isSessionStatus,
  listTestSessions,
  openTestSession,
} from "../services/test-sessions.js";
import { getRankings } from "../services/rankings.js";

const logger = pino({ name: "mctiers-api" });
const publicTiers = [...GLOBAL_TIERS, "N/A"] as const;

function isAuthorized(req: Request, expectedKey: string): boolean {
  const authorization = req.header("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expected = Buffer.from(expectedKey);
  const actual = Buffer.from(supplied);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function requireApiKey(expectedKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isAuthorized(req, expectedKey)) {
      res.status(401).json({ error: "A valid bearer API key is required." });
      return;
    }
    next();
  };
}

function parseOrRespond<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  res: Response,
): z.infer<TSchema> | undefined {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request.",
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return undefined;
  }
  return parsed.data;
}

export function createApiApp(apiAdminKey: string) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "64kb" }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.get("/healthz", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok" });
    } catch (error) {
      logger.error({ err: error }, "Health check could not reach PostgreSQL");
      res.status(503).json({ status: "unavailable" });
    }
  });

  const api = express.Router();
  api.use(requireApiKey(apiAdminKey));

  api.get("/taxonomy", (_req, res) => {
    res.json({
      regions: REGIONS,
      globalTiers: GLOBAL_TIERS,
      rankingBestToWorst: [
        "HT1",
        "LT1",
        "HT2",
        "LT2",
        "HT3",
        "LT3",
        "HT4",
        "LT4",
        "HT5",
        "LT5",
      ],
      unranked: "N/A",
    });
  });

  api.get("/rankings", async (req, res) => {
    const querySchema = z.object({
      region: z.enum(REGIONS).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(100),
    });
    const query = parseOrRespond(querySchema, req.query, res);
    if (!query) return;
    res.json(await getRankings(query.region, query.limit));
  });

  api.get("/test-sessions", async (req, res) => {
    const statusValues = Object.values(TestSessionStatus);
    const querySchema = z.object({
      status: z.enum(statusValues as [string, ...string[]]).optional(),
      region: z.enum(REGIONS).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    });
    const query = parseOrRespond(querySchema, req.query, res);
    if (!query) return;
    const status =
      query.status && isSessionStatus(query.status)
        ? query.status
        : undefined;
    res.json({
      sessions: await listTestSessions({
        status,
        region: query.region,
        limit: query.limit ?? 50,
      }),
    });
  });

  api.post("/test-sessions", async (req, res) => {
    const bodySchema = z.object({
      candidateDiscordId: z.string().regex(/^\d{16,22}$/),
      candidateUsername: z.string().trim().min(1).max(100),
      region: z.enum(REGIONS),
      previousTier: z.enum(publicTiers),
      openedByDiscordId: z.string().regex(/^\d{16,22}$/),
    });
    const body = parseOrRespond(bodySchema, req.body, res);
    if (!body) return;
    const session = await openTestSession(body);
    res.status(201).json({ session });
  });

  api.post("/test-sessions/:id/complete", async (req, res) => {
    const bodySchema = z.object({
      assignedTier: z.enum(publicTiers),
      completedByDiscordId: z.string().regex(/^\d{16,22}$/),
      note: z.string().trim().max(1000).optional(),
    });
    const body = parseOrRespond(bodySchema, req.body, res);
    if (!body) return;
    const sessionId = z.string().min(1).max(64).safeParse(req.params.id);
    if (!sessionId.success) {
      res.status(400).json({ error: "Invalid test session ID." });
      return;
    }
    const result = await completeTestSession({
      sessionId: sessionId.data,
      ...body,
    });
    res.json({ session: result });
  });

  app.use("/api/v1", api);

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    logger.error({ err: error }, "Unhandled API error");
    res.status(500).json({ error: "Internal server error." });
  };
  app.use(errorHandler);

  return app;
}
