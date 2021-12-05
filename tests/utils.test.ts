import { renderHook } from "@testing-library/react-hooks";
import { useEffect } from "react";

import { useMountedState, useDeepMemo, useRefFn, getStrByFn } from "../src";

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

describe("useRefFn", () => {
  it("should be defined", () => {
    expect(useRefFn).toBeDefined();
  });

  it("effect", () => {
    const fn = jest.fn();
    const fn01 = (num: number) => num;
    const fn02 = (num: number) => num + 1;

    const { result, rerender } = renderHook(
      (props) => {
        const ref = useRefFn(props);

        useEffect(() => {
          fn();
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [ref]);

        return ref;
      },
      {
        initialProps: fn01,
      },
    );

    expect(fn).toHaveBeenCalledTimes(1);

    rerender();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result.current.current(1)).toEqual(1);

    rerender(fn02);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result.current.current(1)).toEqual(2);
  });
});

describe("getStrByFn", () => {
  it("string/number", () => {
    expect(getStrByFn("demo")).toBe("demo");
    expect(getStrByFn(1)).toBe(1);
    expect(getStrByFn(3.1415)).toBe(3.1415);
    expect(getStrByFn(null as any)).toBeNull();
    expect(getStrByFn(undefined as any)).toBeUndefined();
  });

  it("function", () => {
    expect(getStrByFn(() => "demo")).toBe("demo");
    expect(getStrByFn(() => 3.1415)).toBe(3.1415);
    expect(getStrByFn((a: string) => a, "demo")).toBe("demo");
    expect(getStrByFn((a: number, b: number) => a + b, 1, 2)).toBe(3);
    expect(getStrByFn((a: number) => a, 3.1415)).toBe(3.1415);
    expect(getStrByFn((a: number) => a, undefined as any)).toBeUndefined();
    expect(getStrByFn((a: number) => a, null as any)).toBeNull();
    expect(getStrByFn((a: number) => a, false as any)).toBeFalsy();
  });
});
