import { renderHook, mockAdapter, act } from "./utils";

import { useResource } from "../src";

const okResponse = { code: 0, data: [1, 2], message: null };
const errResponse = { code: 2001, data: [3, 4], message: "some error" };

describe("useResource", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply(200, okResponse);
    mockAdapter.onGet("/400").reply(400, errResponse);
  });

  it("response success", async () => {
    const { result, waitFor } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();

    void act(() => {
      result.current[1]();
    });

    expect(result.current[0].isLoading).toBeTruthy();

    await waitFor(() => {
      expect(result.current[0].error).toBeUndefined();
      expect(result.current[0].data).toStrictEqual(okResponse);
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

    await waitForNextUpdate();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error?.code).toBe(errResponse.code);
    expect(result.current[0].error?.data).toStrictEqual(errResponse);
  });

  it("unmount", () => {
    const { result, unmount } = renderHook(() =>
      useResource(() => ({ url: "/users", method: "GET" })),
    );

    expect(result.current[0].isLoading).toBeFalsy();
    expect(result.current[0].data).toBeUndefined();
    expect(result.current[0].error).toBeUndefined();

    void act(() => {
      result.current[1]();
    });

    unmount();
  });
});
