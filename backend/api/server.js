"use strict";

import cors from "cors";
import express from "express";
import { pathToFileURL } from "node:url";

import lotteriesRouter
  from "../routes/lotteries.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: true,
      methods: ["GET", "OPTIONS"],
      allowedHeaders: [
        "Accept",
        "Content-Type",
      ],
      maxAge: 86400,
    }),
  );

  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_request, response) => {
    return response.json({
      ok: true,
      service: "palpitaco-loterias-api",
      projectId:
        process.env.FIREBASE_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        null,
      readOnly: true,
    });
  });

  app.use(
    "/api/lotteries",
    lotteriesRouter,
  );

  app.use((request, response) => {
    return response.status(404).json({
      ok: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Rota não encontrada.",
        path: request.path,
      },
    });
  });

  app.use(
    (error, _request, response, _next) => {
      console.error(
        "[PUBLIC_API_UNHANDLED_ERROR]",
        error,
      );

      return response.status(500).json({
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Erro interno da API.",
        },
      });
    },
  );

  return app;
}

export function startServer({
  port = Number(process.env.PORT || 8080),
  host = process.env.HOST || "0.0.0.0",
} = {}) {
  const app = createApp();

  const server = app.listen(
    port,
    host,
    () => {
      const address = server.address();
      const resolvedPort =
        typeof address === "object" &&
        address
          ? address.port
          : port;

      console.log(
        `[PALPITACO_LOTERIAS_API] ` +
        `listening=${host}:${resolvedPort}`,
      );
    },
  );

  return server;
}

const executedDirectly =
  process.argv[1] &&
  import.meta.url ===
    pathToFileURL(process.argv[1]).href;

if (executedDirectly) {
  startServer();
}
