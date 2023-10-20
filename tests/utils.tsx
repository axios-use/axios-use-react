/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";
import type { FC, PropsWithChildren } from "react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import type { RenderHookOptions } from "@testing-library/react-hooks";
import { renderHook } from "@testing-library/react-hooks";

import type { RequestContextConfig } from "../src";
import { RequestProvider } from "../src";
import { wrapCache } from "../src/cache";

const mockAdapter = new MockAdapter(axios);

export const cache = wrapCache(new Map());

const AllTheProviders: FC<
  PropsWithChildren<Omit<RequestContextConfig, "instance">>
> = (props) => (
  <RequestProvider instance={axios} {...props} cache={props.cache ?? cache}>
    {props.children}
  </RequestProvider>
);

function customRenderHook<P, R>(
  callback: (props: P) => R,
  options?: RenderHookOptions<P> & RequestContextConfig,
) {
  const { cache, cacheKey, cacheFilter, customCreateReqError, ...rest } =
    options || {};
  return renderHook<P, R>(callback, {
    // eslint-disable-next-line react/display-name
    wrapper: (props) => (
      <AllTheProviders
        cache={cache}
        cacheKey={cacheKey}
        cacheFilter={cacheFilter}
        customCreateReqError={customCreateReqError}
        {...props}
      />
    ),
    ...rest,
  });
}

export * from "@testing-library/react-hooks";

type Equal<Left, Right> = [Left] extends [Right]
  ? [Right] extends [Left]
    ? true
    : false
  : false;
type MismatchArgs<B extends boolean, C extends boolean> = Equal<
  B,
  C
> extends true
  ? []
  : [never];

export const expectTypeShell = <R,>(
  r: R,
): { type<T>(...args: MismatchArgs<Equal<R, T>, true>): R } => ({
  type: () => r,
});

export {
  customRenderHook as renderHook,
  mockAdapter,
  renderHook as originalRenderHook,
  axios,
};
