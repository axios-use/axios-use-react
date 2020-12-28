import { renderHook as originalRenderHook } from "@testing-library/react-hooks";
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
      const [data, other] = await result.current[0]().ready();
      expect(data).toStrictEqual(okResponse);
      expect(other?.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(other?.request?.responseURL).toBe("/users");
    });
  });

  it("ready() error", async () => {
    const { result } = renderHook(() =>
      useRequest(() => ({ url: "/400", method: "GET" })),
    );

    await act(async () => {
      try {
        await result.current[0]().ready();
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
      void result.current[0]().ready();
      expect(result.current[1].hasPending).toBeFalsy();
    });

    unmount();
    expect(result.current[1].hasPending).toBeTruthy();
  });

  it("No axios instance", () => {
    const { result } = originalRenderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" })),
    );

    void act(() => {
      try {
        result.current[0]();
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(error?.message).toEqual(
          "react-request-hook requires an Axios instance to be passed through context via the <RequestProvider>",
        );
      }
    });
  });
});
