import { renderHook, mockAdapter, act } from "./utils";

import { useRequest, RequestError } from "../src";

const okResponse = { code: 0, data: [1, 2], message: null };
const errResponse = { code: 2001, data: [3, 4], message: "some error" };

describe("useRequest", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply(200, okResponse);
    mockAdapter.onGet("/400").reply(400, errResponse);
  });

  it("ready() success", async () => {
    const { result } = renderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" })),
    );

    await act(async () => {
      const res = await result.current[1]().ready();
      expect(res).toStrictEqual(okResponse);
    });
  });

  it("ready() error", async () => {
    const { result } = renderHook(() =>
      useRequest(() => ({ url: "/400", method: "GET" })),
    );

    await act(async () => {
      try {
        await result.current[1]().ready();
      } catch (e) {
        const error = e as RequestError<typeof errResponse>;
        expect(error.data).toStrictEqual(errResponse);
        expect(error.code).toStrictEqual(errResponse.code);
        expect(error.original?.response?.status).toStrictEqual(400);
      }
    });
  });

  it("State", () => {
    const { result, unmount } = renderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" })),
    );

    void act(() => {
      void result.current[1]().ready();
      expect(result.current[0].hasPending).toBeFalsy();
    });

    unmount();
    expect(result.current[0].hasPending).toBeTruthy();
  });
});
