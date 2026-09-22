import { createServerFn } from "@tanstack/react-start";

/** Thin RPC so the login page never pulls PGLite / `node:crypto` into the browser bundle. */
export const seedDemoIfNeeded = createServerFn({ method: "GET" }).handler(async () => {
  const { ensureDemoSeed } = await import("./seed-demo");
  return ensureDemoSeed();
});
