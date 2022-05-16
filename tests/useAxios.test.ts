import { renderHook, mockAdapter, act, cache } from "./utils";

import { useAxios } from "../src";

const okResponse = { code: 0, data: [1, 2], message: null };
const okResponse2 = { code: 0, data: "res2", message: null };

describe("useAxios", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply((config) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (config.params?.type === 2) {
        return [200, okResponse2];
      }
      return [200, okResponse];
    });
  });

  beforeEach(() => {
    cache.clear();
  });

  afterAll(() => {
    cache.clear();
  });

  it("arguments: config", async () => {
    const { result } = renderHook(() =>
      useAxios<typeof okResponse>({ url: "/users", method: "GET" }),
    );

    await act(async () => {
      const [data, other] = await result.current[0]().ready();
      // check response type
      expect(data?.data).toStrictEqual(okResponse.data);
      expect(other?.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(other?.request?.responseURL).toBe("/users");
    });
  });

  it("arguments: url string", async () => {
    const { result } = renderHook(() => useAxios("/users"));

    await act(async () => {
      const [data, other] = await result.current[0]().ready();
      expect(data).toStrictEqual(okResponse);
      expect(other?.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(other?.request?.responseURL).toBe("/users");
    });
  });

  it("arguments: config, options", async () => {
    const onCompleted = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useAxios({ url: "/users", method: "GET" }, { onCompleted }),
    );

    await act(async () => {
      expect(onCompleted).toHaveBeenCalledTimes(0);
      expect(onError).toHaveBeenCalledTimes(0);

      const [data, other] = await result.current[0]().ready();
      expect(data).toStrictEqual(okResponse);

      expect(onCompleted).toHaveBeenCalledTimes(1);
      expect(onCompleted).toHaveBeenCalledWith(data, other);
      expect(onError).toHaveBeenCalledTimes(0);
    });
  });

  it("custom arguments", async () => {
    const { result } = renderHook(() => useAxios("/users"));

    await act(async () => {
      const [data, other] = await result.current[0]({}).ready();
      expect(data).toStrictEqual(okResponse);
      expect(other?.status).toBe(200);
    });

    await act(async () => {
      const [data, other] = await result.current[0]({
        params: { type: 2 },
      }).ready();
      expect(data).not.toStrictEqual(okResponse);
      expect(data).toStrictEqual(okResponse2);
      expect(other?.status).toBe(200);
    });
  });
});
