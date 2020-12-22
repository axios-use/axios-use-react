import { renderHook, mockAdapter, act } from "./utils";

import { useResource } from "../src";

describe("useResource", () => {
  beforeAll(() => {
    mockAdapter.onGet("/users").reply(200, [1, 2]);
  });

  it("response", async () => {
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
      expect(result.current[0].data).toStrictEqual([1, 2]);
    });
  });
});
