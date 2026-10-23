/** Runs once at server start: refuse to boot with an unsafe Firebase environment. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
