import { useRef, useEffect, useCallback } from "react";
import isEqual from "fast-deep-equal";

/**
 * useMountedState
 */
export function useMountedState(): () => boolean {
  const mountedRef = useRef<boolean>(false);

  const getMounted = useCallback(() => mountedRef.current, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  });

  return getMounted;
}

/**
 * useDeepMemo
 * @param value
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);

  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}

/**
 *
 * @param strOrFn
 * @param args
 * @returns string | number | undefined
 */
export function getStrByFn<F extends (...args: any[]) => string | number>(
  strOrFn?: string | number | F,
  ...args: Parameters<F>
): string | number | undefined {
  if (typeof strOrFn === "function") {
    return strOrFn(...args);
  }
  return strOrFn;
}
