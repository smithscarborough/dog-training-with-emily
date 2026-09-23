import { createServerFn } from "@tanstack/react-start";

/** Thin RPC so the login page never pulls PGLite / `node:crypto` into the browser bundle. */
export const seedDemoIfNeeded = createServerFn({ method: "GET" }).handler(async () => {
  const { ensureDemoSeed, ensureQaAdmin } = await import("./seed-demo");
  const seeded = await ensureDemoSeed();
  await ensureQaAdmin();
  return seeded;
});
