import { defaultCacheKeyGenerator } from "../src";

describe("defaultCacheKeyGenerator", () => {
  it("should be defined", () => {
    expect(defaultCacheKeyGenerator).toBeDefined();
  });

  it("compare", () => {
    expect(
      defaultCacheKeyGenerator({
        baseURL: "https://example.com/",
        url: "/users",
        method: "GET",
      }),
    ).toStrictEqual(
      defaultCacheKeyGenerator({
        baseURL: "https://example.com",
        url: "/users/",
        method: "get",
      }),
    );

    expect(
      defaultCacheKeyGenerator({
        baseURL: "https://example.com/",
        url: "/users",
        method: "GET",
      }),
    ).not.toStrictEqual(
      defaultCacheKeyGenerator({
        baseURL: "https://example.com",
        url: "/users/",
        method: "delete",
      }),
    );

    expect(
      defaultCacheKeyGenerator({
        url: "/users",
        params: { a: 1, b: 2 },
      }),
    ).toStrictEqual(
      defaultCacheKeyGenerator({
        url: "/users",
        params: { b: 2, a: 1 },
      }),
    );
    expect(
      defaultCacheKeyGenerator({
        url: "/users",
        params: { a: 1, b: 2 },
      }),
    ).not.toStrictEqual(
      defaultCacheKeyGenerator({
        url: "/users",
        params: { b: 2, a: 2 },
      }),
    );

    expect(
      defaultCacheKeyGenerator({
        url: "/users",
        data: { a: 1, b: 2, c: [1, 2] },
      }),
    ).toStrictEqual(
      defaultCacheKeyGenerator({
        url: "/users",
        data: { c: [1, 2], b: 2, a: 1 },
      }),
    );
  });
});
