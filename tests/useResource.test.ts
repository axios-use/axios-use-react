import { renderHook, mockAdapter, act } from "./utils";

import { useResource } from "../src";

const okResponse = { code: 0, data: [1, 2], message: null };
const errResponse = { code: 2001, data: [3, 4], message: "some error" };

describe("useResource", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply(200, okResponse);
    mockAdapter.onGet("/400").reply(400, errResponse);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    mockAdapter.onGet("/params").reply((config) => [200, config.params]);
  });

  it("response success", async () => {
    const { result, waitFor } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    void act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    await waitFor(() => {
      expect(result.current[0].error).toBeUndefined();
      expect(result.current[0].data).toStrictEqual(okResponse);
      expect(result.current[0].other?.status).toBe(200);
    });
  });

  it("response error", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useResource(() => ({ url: "/400", method: "GET" })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();

    void act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    await waitForNextUpdate();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();
    expect(result.current[0].error?.code).toBe(errResponse.code);
    expect(result.current[0].error?.data).toStrictEqual(errResponse);
  });

  it("dep request", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useResource((...args: number[]) => ({
        url: "/params",
        method: "GET",
        params: args,
      })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();

    void act(() => {
      result.current[1](1, 2);
      result.current[1](3, 4);
      result.current[1](5, 6);
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toBeUndefined();

    await waitForNextUpdate();

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toStrictEqual([5, 6]);
  });

  it("unmount", () => {
    const { result, unmount } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();
    expect(result.current[0].other).toBeUndefined();

    void act(() => {
      result.current[1]();
    });

    unmount();
  });

  it("clear", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" })),
    );

    void act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();

    void act(() => {
      result.current[0].cancel();
    });

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();

    await waitForNextUpdate();
  });

  it("requestParams", async () => {
    const { result, rerender, unmount, waitForNextUpdate } = renderHook(
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

    await waitForNextUpdate();

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toStrictEqual([1]);
    expect(result.current[0].error).toBeUndefined();

    rerender([1, 2]);
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([1]);
    expect(result.current[0].error).toBeUndefined();

    await waitForNextUpdate();

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toStrictEqual([1, 2]);
    expect(result.current[0].error).toBeUndefined();

    void act(() => {
      result.current[1](3);
    });

    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([1, 2]);
    expect(result.current[0].error).toBeUndefined();

    await waitForNextUpdate();

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toStrictEqual([3]);
    expect(result.current[0].error).toBeUndefined();

    rerender([5, 6]);
    expect(result.current[0].isLoading).toBeTruthy();
    expect(result.current[0].data).toStrictEqual([3]);
    expect(result.current[0].error).toBeUndefined();

    unmount();
    expect(result.current[0].data).toStrictEqual([3]);
  });
});
