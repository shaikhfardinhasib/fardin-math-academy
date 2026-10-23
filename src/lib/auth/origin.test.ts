import { describe, expect, it } from "vitest";
import { isAllowedOrigin, parseAllowedOrigins } from "./origin";

const h = (init: Record<string, string>) => new Headers(init);

describe("isAllowedOrigin", () => {
  it("accepts same-origin requests", () => {
    expect(isAllowedOrigin(h({ origin: "http://localhost:3000", host: "localhost:3000" }), [])).toBe(true);
    expect(
      isAllowedOrigin(h({ origin: "https://app.example.com", host: "internal:8080", "x-forwarded-host": "app.example.com" }), []),
    ).toBe(true);
  });

  it("rejects a missing, null or foreign Origin", () => {
    expect(isAllowedOrigin(h({ host: "localhost:3000" }), [])).toBe(false);
    expect(isAllowedOrigin(h({ origin: "null", host: "localhost:3000" }), [])).toBe(false);
    expect(isAllowedOrigin(h({ origin: "https://evil.example", host: "localhost:3000" }), [])).toBe(false);
    expect(isAllowedOrigin(h({ origin: "http://localhost:3001", host: "localhost:3000" }), [])).toBe(false);
  });

  it("rejects cross-site Fetch Metadata even if hosts match", () => {
    expect(
      isAllowedOrigin(h({ origin: "http://localhost:3000", host: "localhost:3000", "sec-fetch-site": "cross-site" }), []),
    ).toBe(false);
  });

  it("uses the explicit allowlist when configured", () => {
    const allowed = parseAllowedOrigins(" https://app.example.com/ , https://www.example.com");
    expect(allowed).toEqual(["https://app.example.com", "https://www.example.com"]);
    expect(isAllowedOrigin(h({ origin: "https://app.example.com", host: "anything" }), allowed)).toBe(true);
    expect(isAllowedOrigin(h({ origin: "http://app.example.com", host: "app.example.com" }), allowed)).toBe(false);
  });
});
