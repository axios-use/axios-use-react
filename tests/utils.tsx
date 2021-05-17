/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { FC } from "react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import type { RenderHookOptions } from "@testing-library/react-hooks";
import { renderHook } from "@testing-library/react-hooks";

import type { RequestContextConfig } from "../src";
import { RequestProvider } from "../src";
import { wrapCache } from "../src/cache";

const mockAdapter = new MockAdapter(axios);

export const cache = wrapCache(new Map());

const AllTheProviders: FC<{ cache?: RequestContextConfig["cache"] }> = (
  props,
) => (
  <RequestProvider
    value={{ axiosInstance: axios, cache: props.cache ?? cache }}>
    {props.children}
  </RequestProvider>
);

function customRenderHook<P, R>(
  callback: (props: P) => R,
  options?: RenderHookOptions<P> & {
    cache?: RequestContextConfig["cache"];
  },
) {
  const { cache, ...rest } = options || {};
  return renderHook<P, R>(callback, {
    // eslint-disable-next-line react/display-name
    wrapper: (props) => <AllTheProviders cache={cache} {...props} />,
    ...rest,
  });
}

export * from "@testing-library/react-hooks";

export {
  customRenderHook as renderHook,
  mockAdapter,
  renderHook as originalRenderHook,
  axios,
};
