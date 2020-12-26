import { renderHook } from "@testing-library/react-hooks";

import { useMountedState, useDeepMemo } from "../src";

describe("useMountedState", () => {
  it("should be defined", () => {
    expect(useMountedState).toBeDefined();
  });

  it("Mount", () => {
    const { result } = renderHook(() => useMountedState());

    expect(result.current()).toBeTruthy();
  });

  it("Unmount", () => {
    const { rerender, unmount, result } = renderHook(() => useMountedState());

    expect(result.current()).toBeTruthy();

    rerender();
    expect(result.current()).toBeTruthy();

    unmount();

    expect(result.current()).toBeFalsy();
  });
});

describe("useDeepMemo", () => {
  const obj1 = { a: 1, b: { b1: 2 } };
  const obj2 = { a: 1, b: { b1: 2 } };

  it("should be defined", () => {
    expect(useDeepMemo).toBeDefined();
  });

  it("Raw", () => {
    const { result } = renderHook(() => useDeepMemo(obj1));

    expect(result.current).toEqual(obj1);
  });

  it("Compare", () => {
    const { result, rerender, unmount } = renderHook(
      (props) => useDeepMemo(props),
      {
        initialProps: obj1,
      },
    );

    expect(result.current).toEqual(obj2);

    obj1.b.b1 = 0;
    expect(result.current).toEqual(obj1);

    obj2.b.b1 = -1;
    expect(result.current).not.toEqual(obj2);

    rerender({ a: 1, b: { b1: 3 } });
    expect(result.current).toEqual({ a: 1, b: { b1: 3 } });

    unmount();
  });
});
