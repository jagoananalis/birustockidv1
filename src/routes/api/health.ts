import { createFileRoute } from "@tanstack/react-router";
import {
  getDbSource,
  getSql,
} from "@/lib/db";

export const Route = createFileRoute(
  "/api/health",
)({
  server: {
    handlers: {
      GET: async () => {
        try {
          const source = getDbSource();
          const sql = await getSql();

          const rows = await sql<{
            count: number;
          }>`
            select count(*)::int as count
            from analisis
          `;

          return Response.json(
            {
              databaseSource: source,
              connectionStatus: "connected",
              analisisCount:
                rows[0]?.count ?? 0,
            },
            {
              status: 200,
              headers: {
                "cache-control": "no-store",
              },
            },
          );
        } catch (error) {
          console.error(
            "[health] database check failed:",
            error,
          );

          return Response.json(
            {
              databaseSource: "unknown",
              connectionStatus: "error",
              analisisCount: null,
              ...(process.env.NODE_ENV !== "production"
                ? { error: error instanceof Error ? error.message : String(error) }
                : {}),
            },
            {
              status: 503,
              headers: {
                "cache-control": "no-store",
              },
            },
          );
        }
      },
    },
  },
});