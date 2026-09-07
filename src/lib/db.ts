import { pendingMigrations } from "../../scripts/migration-plan.mjs";

/** Which database backend is active for the current server runtime. */
export type DbSource = "neon" | "pglite";

/**
 * Runtime environment is read when the server function actually runs.
 *
 * This is intentional: TanStack Start documents that server environment
 * variables should not be captured at module scope because the module can be
 * loaded outside the request lifecycle and that pattern is not portable across
 * SSR runtimes.
 */
function getRuntimeDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  const value = raw?.trim();
  return value ? value : undefined;
}

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

function isVercelProduction(): boolean {
  return isVercelRuntime() && process.env.VERCEL_ENV === "production";
}

function getRuntimeDbConfig(): { source: DbSource; databaseUrl?: string } {
  const databaseUrl = getRuntimeDatabaseUrl();

  // Never silently switch a Vercel Production deployment to local PGLite.
  // A missing DATABASE_URL is a deployment/configuration failure and must be
  // visible immediately instead of producing a confusing empty CMS.
  if (!databaseUrl && isVercelProduction()) {
    throw new Error("DATABASE_URL is not configured in production");
  }

  // PGLite is a local-development convenience only. Never use it on Vercel,
  // including Preview deployments, where the application must use shared Neon.
  if (!databaseUrl && isVercelRuntime()) {
    throw new Error("DATABASE_URL is not configured on Vercel");
  }

  return {
    source: databaseUrl ? "neon" : "pglite",
    databaseUrl,
  };
}

/** Current backend for the current server runtime. Never exposes credentials. */
export function getDbSource(): DbSource {
  return getRuntimeDbConfig().source;
}

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects.
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

/**
 * Init state lives on globalThis so Vite HMR does not create multiple pools or
 * concurrent PGLite migration passes in development.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
  __pgBootstrapPromise__?: Promise<void>;
};

/** Postgres OIDs used to normalize values consistently across backends. */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

/** Wrap a query runner in the tagged-template + `.query()` Sql surface. */
function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) {
      text += `$${i + 1}${strings[i + 1]}`;
    }
    return run<T>(text, values);
  }) as unknown as Sql;

  sql.query = <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ) => run<T>(text, params);

  return sql;
}

function createNeonSql(databaseUrl: string): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    // node-postgres connects directly to the Neon Postgres endpoint. The pool
    // is created lazily and then reused by warm serverless invocations.
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);

    const pool = new Pool({ connectionString: databaseUrl });
    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });

  return globalRef.__pgSqlPromise__;
}

async function createPgliteSql(): Promise<Sql> {
  // PGLite is intentionally imported only in the non-production fallback path.
  // Vercel Production is blocked above when DATABASE_URL is missing.
  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });

  const pg = await globalRef.__pgliteInstance__;

  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;

    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = doneRows.rows.map((row) => row.name);

    for (const { name, path } of pendingMigrations(
      Object.keys(migrations),
      done,
    )) {
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };

  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined)
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;
let sqlSource: DbSource | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }

  const config = getRuntimeDbConfig();
  if (config.source === "neon") {
    return createNeonSql(config.databaseUrl!);
  }
  return createPgliteSql();
}

/**
 * Get the shared, server-only SQL client.
 *
 * Production on Vercel: Neon is mandatory.
 * Local development: PGLite remains available when DATABASE_URL is absent.
 */
export function getSql(): Promise<Sql> {
  const currentSource = getDbSource();

  // The normal process lifetime has one source. This guard also prevents a
  // stale development PGLite promise from being reused if environment values
  // are changed and the module is retained by the dev server.
  if (!sqlPromise || sqlSource !== currentSource) {
    sqlSource = currentSource;
    sqlPromise = createSql().catch((err) => {
      sqlPromise = null;
      sqlSource = null;
      throw err;
    });
  }

  return sqlPromise;
}

/**
 * Shared PGLite instance for local development only.
 */
export async function getPglite(): Promise<
  import("@electric-sql/pglite").PGlite
> {
  if (getDbSource() !== "pglite") {
    throw new Error(
      "getPglite() is only available on the local PGLite fallback",
    );
  }

  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

/**
 * Finish DB bootstrap for local PGLite development. Neon is lazy and does not
 * need a bootstrap step.
 */
export function ensureDbReady(): Promise<void> {
  if (getDbSource() !== "pglite") return Promise.resolve();
  return getSql().then(() => undefined);
}

// Dev-server convenience only. There is deliberately no eager PGLite bootstrap
// here for Vercel Production; a production request must call getSql(), re-read
// DATABASE_URL, and fail clearly if the variable is absent.
if (typeof window === "undefined" && !isVercelRuntime()) {
  globalRef.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalRef.__pgBootstrapPromise__ = undefined;
    console.error("[db] local PGLite bootstrap failed:", err);
    throw err;
  });
}
