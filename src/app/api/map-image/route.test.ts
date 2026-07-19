import { describe, expect, it } from "vitest";

import { GET } from "./route";

import { getRequest } from "@/test/http";

const BASE = "https://example.test/api/map-image";

describe("GET /api/map-image", () => {
  it("returns the proxied mock map image with a cache header", async () => {
    const response = await GET(getRequest(BASE));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/");
    expect(response.headers.get("cache-control")).toContain("max-age");
    const body = await response.text();
    expect(body).toContain("<svg");
  });

  it("accepts bounded width/height/zoom query parameters", async () => {
    const response = await GET(getRequest(`${BASE}?width=400&height=300&zoom=14`));
    expect(response.status).toBe(200);
  });

  it("rejects an out-of-range zoom with a 400", async () => {
    const response = await GET(getRequest(`${BASE}?zoom=99`));
    expect(response.status).toBe(400);
  });

  it("rejects an oversized width with a 400", async () => {
    const response = await GET(getRequest(`${BASE}?width=5000`));
    expect(response.status).toBe(400);
  });
});
