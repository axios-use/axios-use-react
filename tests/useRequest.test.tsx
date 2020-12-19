import { renderHook, mockAdapter, act } from "./utils";

import { useRequest } from "../src";

describe("useRequest", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply(200, [1, 2]);
  });
  it("ready()", async () => {
    const { result } = renderHook(() =>
      useRequest(() => ({ url: "/users", method: "GET" })),
    );

    await act(async () => {
      const res = await result.current[1]().ready();
      expect(res).toStrictEqual([1, 2]);
    });
  });
});
