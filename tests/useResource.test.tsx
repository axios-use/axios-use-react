import type { PropsWithChildren } from "react";
import React from "react";
import {
  renderHook,
  originalRenderHook,
  mockAdapter,
  act,
  cache,
  axios,
  waitFor,
} from "./utils";

import type { Resource, RequestContextConfig } from "../src";
import {
  request,
  useResource,
  RequestProvider,
  wrapCache,
  defaultCacheKeyGenerator,
} from "../src";

const okResponse = { code: 0, data: [1, 2], message: null };
const okResponse2 = { code: 0, data: "res2", message: null };
const errResponse = { code: 2001, data: [3, 4], message: "some error" };

describe("useResource", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply(200, okResponse);
    mockAdapter.onGet("/400").reply(400, errResponse);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    mockAdapter.onGet("/params").reply((config) => [200, config.params]);
  });

  beforeEach(() => {
    cache.clear();
  });

  afterAll(() => {
    cache.clear();
  });

  it("response success", async () => {
    const { result } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].error).toBeUndefined();
      expect(result.current[0].data).toStrictEqual(okResponse);
      expect(result.current[0].response?.data).toStrictEqual(okResponse);
      expect(result.current[0].response?.status).toBe(200);
      expect(result.current[0].other?.status).toBe(200);
    });
  });

  it("response error", async () => {
    const { result } = renderHook(() =>
      useResource(() => ({ url: "/400", method: "GET" })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();

    act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toBeUndefined();
      expect(result.current[0].other).toBeUndefined();
      expect(result.current[0].error?.code).toBe(errResponse.code);
      expect(result.current[0].error?.data).toStrictEqual(errResponse);
    });
  });

  it("dep request", async () => {
    const { result } = renderHook(() =>
      useResource((...args: number[]) => ({
        url: "/params",
        method: "GET",
        params: args,
      })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();

    act(() => {
      result.current[1](1, 2);
      result.current[1](3, 4);
      result.current[1](5, 6);
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([5, 6]);
    });
  });

  it("unmount", () => {
    const { result, unmount } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    act(() => {
      result.current[1]();
    });

    unmount();
  });

  it("clear", () => {
    const { result, unmount } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" })),
    );

    act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();

    act(() => {
      result.current[0].cancel();
    });

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();
    unmount();
  });

  it("requestParams", async () => {
    const { result, rerender, unmount } = renderHook(
      (props: number[]) =>
        useResource(
          (...args: number[]) => ({
            url: "/params",
            method: "GET",
            params: args,
          }),
          props,
        ),
      {
        initialProps: [1],
      },
    );

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([1]);
      expect(result.current[0].error).toBeUndefined();
    });

    rerender([1, 2]);
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([1]);
    expect(result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([1, 2]);
      expect(result.current[0].error).toBeUndefined();
    });

    act(() => {
      result.current[1](3);
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([1, 2]);
    expect(result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([3]);
      expect(result.current[0].error).toBeUndefined();
    });

    rerender([5, 6]);
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([3]);
    expect(result.current[0].error).toBeUndefined();

    unmount();
    expect(result.current[0].data).toStrictEqual([3]);

    await waitFor(() => {
      expect(result.current[0].data).toStrictEqual([3]);
    });
  });

  it("options: filter", async () => {
    const { result, rerender } = renderHook(
      (props: number[]) =>
        useResource(
          (...args: number[]) => ({
            url: "/params",
            method: "GET",
            params: args,
          }),
          props,
          {
            filter: (a, b) => a !== b,
          },
        ),
      {
        initialProps: [1],
      },
    );

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([1]);
      expect(result.current[0].error).toBeUndefined();
    });

    rerender([1, 2]);
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([1]);
    expect(result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([1, 2]);
      expect(result.current[0].error).toBeUndefined();
    });

    rerender([2, 2]);
    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toStrictEqual([1, 2]);
    expect(result.current[0].error).toBeUndefined();

    act(() => {
      result.current[1](3, 3);
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([1, 2]);
    expect(result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([3, 3]);
      expect(result.current[0].error).toBeUndefined();
    });

    const hook02 = renderHook(
      (props: number[]) =>
        useResource(
          (...args: number[]) => ({
            url: "/params",
            method: "GET",
            params: args,
          }),
          props,
          { filter: (a, b) => a !== b },
        ),
      {
        initialProps: [1, 1],
      },
    );

    expect(hook02.result.current[0].isLoading).toBeFalsy();
    expect(hook02.result.current[0].data).toBeUndefined();
    expect(hook02.result.current[0].error).toBeUndefined();
  });

  it("options: defaultState", async () => {
    const { result, rerender } = renderHook((props: number[]) =>
      useResource(
        (...args: number[]) => ({
          url: "/params",
          method: "GET",
          params: args,
        }),
        props,
        {
          defaultState: {
            data: [1, 2, 3],
          },
        },
      ),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toStrictEqual([1, 2, 3]);
    expect(result.current[0].error).toBeUndefined();

    rerender([3, 4]);
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([1, 2, 3]);
    expect(result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([3, 4]);
      expect(result.current[0].error).toBeUndefined();
    });

    act(() => {
      result.current[1](5, 6);
    });
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([3, 4]);
    expect(result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([5, 6]);
      expect(result.current[0].error).toBeUndefined();
    });
  });

  it("options: onCompleted", async () => {
    const onCompleted = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" }), false, {
        onCompleted,
        onError,
      }),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(onCompleted).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(onCompleted).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);

    await waitFor(() => {
      expect(result.current[0].data).toStrictEqual(okResponse);

      expect(onCompleted).toHaveBeenCalledTimes(1);
      expect(onCompleted).toHaveBeenCalledWith(
        result.current[0].data,
        result.current[0].other,
      );
      expect(onError).toHaveBeenCalledTimes(0);
    });
  });

  it("options: onError", async () => {
    const onCompleted = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useResource(() => ({ url: "/400", method: "GET" }), undefined, {
        onCompleted,
        onError,
      }),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(onCompleted).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(onCompleted).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);

    await waitFor(() => {
      expect(result.current[0].data).toBeUndefined();
      expect(result.current[0].response).toBeUndefined();
      expect(result.current[0].other).toBeUndefined();
      expect(result.current[0].error?.code).toBe(errResponse.code);
      expect(result.current[0].error?.data).toStrictEqual(errResponse);
      expect(onCompleted).toHaveBeenCalledTimes(0);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(result.current[0].error);
    });
  });

  it("options: getResponseItem", async () => {
    const { result } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" }), false, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        getResponseItem: (r) => r?.data?.data,
      }),
    );
    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();

    act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].error).toBeUndefined();
      // custom data
      expect(result.current[0].data).toStrictEqual(okResponse.data);
      expect(result.current[0].response?.data).toStrictEqual(okResponse);
      expect(result.current[0].response?.status).toBe(200);
    });
  });
  it("axios config: transformResponse", async () => {
    const { result: result01 } = renderHook(() =>
      useResource(() => ({
        url: "/users",
        method: "GET",
        transformResponse: () => null,
      })),
    );
    expect(result01.current[0].isLoading).toBeFalsy();
    expect(result01.current[0].data).toBeUndefined();
    expect(result01.current[0].response).toBeUndefined();

    act(() => {
      result01.current[1]();
    });
    await waitFor(() => {
      expect(result01.current[0].isLoading).toBeFalsy();
      expect(result01.current[0].error).toBeUndefined();
      // transformResponse undefined
      expect(result01.current[0].data).toBeNull();
      expect(result01.current[0].response?.data).toBeNull();
      expect(result01.current[0].response?.status).toBe(200);
    });
  });

  it("context: getResponseItem", async () => {
    const { result } = originalRenderHook(
      () => useResource(() => ({ url: "/users", method: "get" })),
      {
        wrapper: (props: PropsWithChildren<RequestContextConfig>) => (
          <RequestProvider
            instance={axios}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            getResponseItem={(r) => r?.data?.data}
            {...props}
          />
        ),
      },
    );
    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();

    act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].error).toBeUndefined();
      // custom data
      expect(result.current[0].data).toStrictEqual(okResponse.data);
      expect(result.current[0].response?.data).toStrictEqual(okResponse);
      expect(result.current[0].response?.status).toBe(200);
    });
  });
});

describe("useResource - cache", () => {
  let rtnData = [1, 2];

  beforeAll(() => {
    mockAdapter.onGet("/get").reply(() => [200, rtnData]);
    mockAdapter.onPost("/post").reply(() => [200, true]);
  });

  beforeEach(() => {
    cache.clear();
  });

  it("cache response", async () => {
    const { result, unmount } = renderHook(() =>
      useResource(() => ({
        url: "/get",
        method: "GET",
      })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();

    act(() => {
      result.current[1]();
    });
    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([1, 2]);
      expect(result.current[0].error).toBeUndefined();
    });

    unmount();

    const req01 = renderHook(() =>
      useResource(() => ({
        url: "/get",
        method: "GET",
      })),
    );

    expect(req01.result.current[0].isLoading).toBeFalsy();
    expect(req01.result.current[0].data).toStrictEqual([1, 2]);
    expect(req01.result.current[0].error).toBeUndefined();

    rtnData = [3, 4];

    act(() => {
      req01.result.current[1]();
    });

    expect(req01.result.current[0].isLoading).toBeTruthy();
    expect(req01.result.current[0].data).toStrictEqual([1, 2]);
    expect(req01.result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(req01.result.current[0].isLoading).toBeFalsy();
      expect(req01.result.current[0].data).toStrictEqual([3, 4]);
      expect(req01.result.current[0].error).toBeUndefined();
    });
  });

  it("cache default filter", async () => {
    const { result, unmount } = renderHook(() =>
      useResource(() => ({
        url: "/post",
        method: "POST",
      })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();

    act(() => {
      result.current[1]();
    });

    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toBeTruthy();
      expect(result.current[0].error).toBeUndefined();
    });

    unmount();

    const req01 = renderHook(() =>
      useResource(() => ({
        url: "/post",
        method: "POST",
      })),
    );

    expect(req01.result.current[0].isLoading).toBeFalsy();
    expect(req01.result.current[0].data).toBeUndefined();
    expect(req01.result.current[0].error).toBeUndefined();

    rtnData = [3, 4];

    act(() => {
      req01.result.current[1]();
    });

    expect(req01.result.current[0].isLoading).toBeTruthy();
    expect(req01.result.current[0].data).toBeUndefined();
    expect(req01.result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(req01.result.current[0].isLoading).toBeFalsy();
      expect(req01.result.current[0].data).toBeTruthy();
      expect(req01.result.current[0].error).toBeUndefined();
    });
  });

  it("cache custom filter", async () => {
    const mycache = wrapCache(new Map());
    const commonKey = "demo-post-key";
    const { result } = originalRenderHook(
      () =>
        useResource(
          () => ({
            url: "/post",
            method: "POST",
            data: true,
          }),
          undefined,
          { cacheKey: commonKey },
        ),
      {
        wrapper: (props: PropsWithChildren<RequestContextConfig>) => (
          <RequestProvider
            instance={axios}
            cache={mycache}
            cacheFilter={(c) => c.data as boolean}
            {...props}
          />
        ),
      },
    );

    act(() => {
      result.current[1]();
    });
    await waitFor(() => {
      expect(result.current[0].data).toBeTruthy();
    });

    const req01 = originalRenderHook(
      () =>
        useResource(
          () => ({
            url: "/post",
            method: "POST",
            data: false,
          }),
          undefined,
          { cacheKey: commonKey },
        ),
      {
        wrapper: (props: PropsWithChildren<RequestContextConfig>) => (
          <RequestProvider
            instance={axios}
            cache={mycache}
            cacheFilter={(c) => c.data as boolean}
            {...props}
          />
        ),
      },
    );
    expect(req01.result.current[0].isLoading).toBeFalsy();
    expect(req01.result.current[0].data).toBeFalsy();
    expect(req01.result.current[0].error).toBeUndefined();

    act(() => {
      req01.result.current[1]();
    });

    await waitFor(() => {
      expect(req01.result.current[0].isLoading).toBeFalsy();
      expect(req01.result.current[0].data).toBeTruthy();
      expect(req01.result.current[0].error).toBeUndefined();
    });

    const req02 = originalRenderHook(
      () =>
        useResource(
          () => ({
            url: "/post",
            method: "POST",
            data: true,
          }),
          undefined,
          { cacheKey: commonKey },
        ),
      {
        wrapper: (props: PropsWithChildren<RequestContextConfig>) => (
          <RequestProvider
            instance={axios}
            cache={mycache}
            cacheFilter={(c) => c.data as boolean}
            {...props}
          />
        ),
      },
    );
    expect(req02.result.current[0].isLoading).toBeFalsy();
    expect(req02.result.current[0].data).toBeTruthy();
    expect(req02.result.current[0].error).toBeUndefined();

    act(() => {
      req02.result.current[1]();
    });

    await waitFor(() => {
      expect(req02.result.current[0].isLoading).toBeFalsy();
      expect(req02.result.current[0].data).toBeTruthy();
      expect(req02.result.current[0].error).toBeUndefined();
    });
  });

  it("cacheKey", async () => {
    rtnData = [1, 2];
    const mycache = wrapCache(new Map());

    const reqConfig: Resource<number[]> = {
      url: "/get",
      method: "GET",
    };

    const { result } = originalRenderHook(() => useResource(() => reqConfig), {
      wrapper: (props: PropsWithChildren<RequestContextConfig>) => (
        <RequestProvider instance={axios} cache={mycache} {...props} />
      ),
    });

    act(() => {
      result.current[1]();
    });

    await waitFor(() => {
      expect(result.current[0].data).toStrictEqual(rtnData);
      expect(mycache.get(defaultCacheKeyGenerator(reqConfig))).toStrictEqual(
        rtnData,
      );
    });

    const customKey = () => "demoKey";
    const req01 = originalRenderHook(
      () => useResource(() => reqConfig, undefined, { cacheKey: customKey }),
      {
        // eslint-disable-next-line react/display-name
        wrapper: (props: PropsWithChildren<RequestContextConfig>) => (
          <RequestProvider instance={axios} cache={mycache} {...props} />
        ),
      },
    );

    act(() => {
      req01.result.current[1]();
    });

    await waitFor(() => {
      expect(result.current[0].data).toStrictEqual(rtnData);
      expect(mycache.get(customKey())).toStrictEqual(rtnData);
      expect(customKey()).not.toStrictEqual(
        defaultCacheKeyGenerator(reqConfig),
      );
    });
  });

  it("close cache", async () => {
    rtnData = [5, 6];

    const { result } = renderHook(
      () =>
        useResource(() => ({
          url: "/get",
          method: "GET",
        })),
      {
        cache: false,
      },
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();

    act(() => {
      result.current[1]();
    });
    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data).toStrictEqual([5, 6]);
      expect(result.current[0].error).toBeUndefined();
    });

    const req01 = renderHook(() =>
      useResource(
        () => ({
          url: "/get",
          method: "GET",
        }),
        undefined,
        { cache: false },
      ),
    );

    expect(req01.result.current[0].isLoading).toBeFalsy();
    expect(req01.result.current[0].data).toBeUndefined();
    expect(req01.result.current[0].error).toBeUndefined();

    rtnData = [7, 8];

    act(() => {
      req01.result.current[1]();
    });

    expect(req01.result.current[0].isLoading).toBeTruthy();
    expect(req01.result.current[0].data).toBeUndefined();
    expect(req01.result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(req01.result.current[0].isLoading).toBeFalsy();
      expect(req01.result.current[0].data).toStrictEqual([7, 8]);
      expect(req01.result.current[0].error).toBeUndefined();
    });

    const req02 = renderHook(
      () =>
        useResource(() => ({
          url: "/get",
          method: "GET",
        })),
      {
        cache: false,
      },
    );

    expect(req02.result.current[0].isLoading).toBeFalsy();
    expect(req02.result.current[0].data).toBeUndefined();
    expect(req02.result.current[0].error).toBeUndefined();

    rtnData = [9, 10];

    act(() => {
      req02.result.current[1]();
    });

    expect(req02.result.current[0].isLoading).toBeTruthy();
    expect(req02.result.current[0].data).toBeUndefined();
    expect(req02.result.current[0].error).toBeUndefined();

    await waitFor(() => {
      expect(req02.result.current[0].isLoading).toBeFalsy();
      expect(req02.result.current[0].data).toStrictEqual([9, 10]);
      expect(req02.result.current[0].error).toBeUndefined();
    });
  });
});

describe("useResource - custom instance", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply((config) => {
      if (config.headers?.["xxxkey"] === "use-request") {
        return [200, okResponse2];
      }
      return [200, okResponse];
    });
  });

  it("options: instance", async () => {
    const instance = axios.create({
      headers: {
        xxxkey: "use-request",
      },
    });
    const { result } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" }), undefined, {
        instance,
      }),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].error).toBeUndefined();
      expect(result.current[0].data).toStrictEqual(okResponse2);
      expect(result.current[0].response?.data).toStrictEqual(okResponse2);
      expect(result.current[0].response?.status).toBe(200);
      expect(result.current[0].other?.status).toBe(200);
    });
  });
});

describe("useResource - check types", () => {
  const getUserReqConfig = (id: string) =>
    request<{ id: string; name: string }>({
      url: `/user/${id}`,
      method: "get",
    });

  const callTimesFn = jest.fn();

  beforeAll(() => {
    mockAdapter.onGet(/\/user\/\w+/).reply((config) => {
      const _id = config.url?.replace(/\/user\//, "").split("/")?.[0];
      if (_id) {
        callTimesFn();
        return [200, { id: _id, name: `name${_id}` }];
      }
      return [404];
    });
  });

  it("check types & refresh func", async () => {
    const { result, rerender } = renderHook((id: string) =>
      useResource(getUserReqConfig, [id], {
        filter: (p) => !!p,
      }),
    );
    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();
    expect(callTimesFn).toHaveBeenCalledTimes(0);

    act(() => {
      result.current[1]("001");
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();
    expect(callTimesFn).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current[0].error).toBeUndefined();
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data?.id).toBe("001");
      expect(result.current[0].data?.name).toBe("name001");
      expect(callTimesFn).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current[2]();
    });

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data?.id).toBe("001");
    expect(result.current[0].data?.name).toBe("name001");
    expect(callTimesFn).toHaveBeenCalledTimes(1);

    rerender("002");
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data?.id).toBe("001");
    expect(result.current[0].data?.name).toBe("name001");
    expect(callTimesFn).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data?.id).toBe("002");
      expect(result.current[0].data?.name).toBe("name002");
      expect(callTimesFn).toHaveBeenCalledTimes(2);
    });

    act(() => {
      result.current[2]();
    });
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data?.id).toBe("002");
    expect(result.current[0].data?.name).toBe("name002");
    expect(callTimesFn).toHaveBeenCalledTimes(3);
    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data?.id).toBe("002");
      expect(result.current[0].data?.name).toBe("name002");
      expect(callTimesFn).toHaveBeenCalledTimes(3);
    });
  });

  it("request function params required", async () => {
    const getUserInfo = (params: { id: string }) => {
      const { id } = params;
      return request<{ id: string; name: string }>({
        url: `/user/${id}`,
        method: "get",
      });
    };

    const { result } = renderHook(() => useResource(getUserInfo));

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();

    act(() => {
      result.current[1]({ id: "001" });
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].response).toBeUndefined();
    await waitFor(() => {
      expect(result.current[0].isLoading).toBeFalsy();
      expect(result.current[0].data?.id).toBe("001");
      expect(result.current[0].data?.name).toBe("name001");
    });
  });
});
