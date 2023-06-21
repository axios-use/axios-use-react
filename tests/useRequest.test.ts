import type { AxiosError, AxiosResponse } from "axios";
import {
  renderHook,
  originalRenderHook,
  mockAdapter,
  act,
  cache,
  axios,
  expectTypeShell,
} from "./utils";

import type { RequestError } from "../src";
import { useRequest, request, _request } from "../src";

const okResponse = { code: 0, data: [1, 2], message: null };
const okResponse2 = { code: 0, data: "res2", message: null };
const errResponse = { code: 2001, data: [3, 4], message: "some error" };
const errResponse2 = { code: 2001, data: [3, 4], msg: "some error" };
type ResOK1Type = typeof okResponse;

describe("useRequest", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply(200, okResponse);
    mockAdapter.onGet("/400").reply(400, errResponse);
    mockAdapter.onGet("/err").reply(400, errResponse2);
  });

  beforeEach(() => {
    cache.clear();
  });

  afterAll(() => {
    cache.clear();
  });

  it("ready() success", async () => {
    const { result } = renderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" })),
    );

    await act(async () => {
      const [data, res] = await result.current[0]().ready();
      expect(data).toStrictEqual(okResponse);
      expect(res.data).toStrictEqual(okResponse);
      expect(res?.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res?.request?.responseURL).toBe("/users");
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
        const error = e as RequestError<typeof errResponse, any, AxiosError>;
        expect(error.data).toStrictEqual(errResponse);
        expect(error.code).toStrictEqual(errResponse.code);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

  it("clear", async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" })),
    );

    void act(() => {
      void result.current[0]()
        .ready()
        .catch((e) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          expect(e.message).toStrictEqual("clear-messgae");
        });
    });

    void act(() => {
      void result.current[0]()
        .ready()
        .then((r) => {
          expect(r[0]).toStrictEqual(okResponse);
        });

      result.current[1].clear("clear-messgae");
    });

    await waitForNextUpdate();

    void act(() => {
      void result.current[0]()
        .ready()
        .catch((e) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          expect(e.message).toStrictEqual("unmount-messgae");
        });
    });

    unmount();

    void act(() => {
      void result.current[0]()
        .ready()
        .then((r) => {
          expect(r[0]).toStrictEqual(okResponse);
        });

      result.current[1].clear("unmount-messgae");
    });
  });

  it("No axios instance", async () => {
    const { result } = originalRenderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" })),
    );

    await act(async () => {
      const [res] = await result.current[0]().ready();
      expect(res).toStrictEqual(okResponse);
    });
  });

  it("customCreateReqError", async () => {
    const { result } = renderHook(
      () => useRequest(() => ({ url: "/err", method: "GET" })),
      {
        customCreateReqError: (err: AxiosError<typeof errResponse2>) => ({
          code: err?.response?.data?.code,
          data: err?.response?.data,
          message: err?.response?.data?.msg || "",
          isCancel: axios.isCancel(err),
          original: err,
        }),
      },
    );

    await act(async () => {
      try {
        await result.current[0]().ready();
      } catch (e) {
        const error = e as RequestError<typeof errResponse2, any, AxiosError>;
        expect(error.data).toStrictEqual(errResponse2);
        expect(error.code).toStrictEqual(errResponse2.code);
        expect(error.message).toStrictEqual(errResponse2.msg);
        expect(error.original?.response?.status).toStrictEqual(400);
      }
    });
  });

  it("options: onCompleted", async () => {
    const onCompleted = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" }), {
        onCompleted,
        onError,
      }),
    );

    await act(async () => {
      expect(onCompleted).toHaveBeenCalledTimes(0);
      expect(onError).toHaveBeenCalledTimes(0);

      const [data, res] = await result.current[0]().ready();
      expect(data).toStrictEqual(okResponse);

      expect(onCompleted).toHaveBeenCalledTimes(1);
      expect(onCompleted).toHaveBeenCalledWith(data, res);
      expect(onError).toHaveBeenCalledTimes(0);
    });
  });

  it("options: onError", async () => {
    const onCompleted = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useRequest(() => ({ url: "/400", method: "GET" }), {
        onCompleted,
        onError,
      }),
    );

    await act(async () => {
      expect(onCompleted).toHaveBeenCalledTimes(0);
      expect(onError).toHaveBeenCalledTimes(0);

      try {
        await result.current[0]().ready();
      } catch (e) {
        const error = e as RequestError<typeof errResponse, any, AxiosError>;
        expect(error.data).toStrictEqual(errResponse);

        expect(onCompleted).toHaveBeenCalledTimes(0);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(error);
      }
    });
  });

  it("width type", async () => {
    const { result } = renderHook(() =>
      useRequest(() => request<ResOK1Type>({ url: "/users", method: "GET" })),
    );
    await act(async () => {
      const [data, res] = await result.current[0]().ready();
      expect(
        expectTypeShell(data).type<ResOK1Type | undefined>(),
      ).toStrictEqual(okResponse);
      expect(
        expectTypeShell(res).type<AxiosResponse<ResOK1Type>>(),
      ).toBeDefined();
      expect(expectTypeShell(res.data).type<ResOK1Type>()).toStrictEqual(
        okResponse,
      );
      expect(res?.status).toBe(200);
    });
  });

  it("custom response type", async () => {
    const { result } = renderHook(() =>
      useRequest(() =>
        _request<AxiosResponse<ResOK1Type["data"]>, any, "data">({
          url: "/users",
          method: "GET",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          transformResponse: (r) => r.data,
        }),
      ),
    );
    await act(async () => {
      const [data, res] = await result.current[0]().ready();
      expect(expectTypeShell(data).type<number[] | undefined>()).toStrictEqual(
        okResponse.data,
      );
      expect(
        expectTypeShell(res).type<AxiosResponse<ResOK1Type["data"]>>().data,
      ).toStrictEqual(okResponse.data);
    });
  });
});

describe("useRequest - custom instance", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply((config) => {
      if (config.headers?.["xxxkey"] === "use-request") {
        return [200, okResponse2];
      }
      return [200, okResponse];
    });
  });

  it("default", async () => {
    const { result } = originalRenderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" })),
    );

    await act(async () => {
      const [res] = await result.current[0]().ready();
      expect(res).toStrictEqual(okResponse);
    });
  });

  it("options: instance", async () => {
    const instance = axios.create({
      headers: {
        xxxkey: "use-request",
      },
    });
    const { result } = originalRenderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" }), { instance }),
    );

    await act(async () => {
      const [res] = await result.current[0]().ready();
      expect(res).toStrictEqual(okResponse2);
    });
  });
});
