import { defaultCacheKeyGenerator } from "../src";
import { _ttlcache } from "../src/cachettl";

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
        baseURL: "https://example.com/",
      }),
    ).toStrictEqual(
      defaultCacheKeyGenerator({
        baseURL: "https://example.com",
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

describe("default ttlcache", () => {
  const _cache = _ttlcache;

  beforeEach(() => {
    _cache.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    _cache.clear();
  });

  it("should be defined", () => {
    expect(_cache).toBeDefined();
  });

  it("read & write", () => {
    const _k = "kkk01";
    expect(_cache.get(_k)).toBeUndefined();

    _cache.set(_k, 1);
    expect(_cache.has(_k)).toBeTruthy();
    expect(_cache.get(_k)).toBe(1);

    jest.advanceTimersByTime(1000 * 60 * 30 - 1);
    expect(_cache.has(_k)).toBeTruthy();
    expect(_cache.get(_k)).toBe(1);
    jest.advanceTimersByTime(1);
    expect(_cache.has(_k)).toBeFalsy();
    expect(_cache.get(_k)).toBeUndefined();
  });

  it("auto clear timer", () => {
    const _k = "kkk01";
    expect(_cache.get(_k)).toBeUndefined();
    _cache.set(_k, 1);
    expect(_cache.has(_k)).toBeTruthy();
    expect(_cache.get(_k)).toBe(1);
    expect(_cache.timers.size).toBe(1);

    _cache.set(_k, 2);
    expect(_cache.has(_k)).toBeTruthy();
    expect(_cache.get(_k)).toBe(2);
    expect(_cache.timers.size).toBe(1);

    jest.advanceTimersByTime(1000 * 60 * 30);
    expect(_cache.has(_k)).toBeFalsy();
    expect(_cache.get(_k)).toBeUndefined();
    expect(_cache.timers.size).toBe(0);
  });

  it("clear all", () => {
    const _k = "kkk01";
    expect(_cache.get(_k)).toBeUndefined();
    _cache.set(_k, 1);
    expect(_cache.has(_k)).toBeTruthy();
    expect(_cache.get(_k)).toBe(1);
    expect(_cache.timers.size).toBe(1);

    _cache.clear();
    expect(_cache.data.size).toBe(0);
    expect(_cache.timers.size).toBe(0);
    expect(_cache.get(_k)).toBeUndefined();
  });
});
