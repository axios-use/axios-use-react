import { FC } from "react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { renderHook, RenderHookOptions } from "@testing-library/react-hooks";

import { RequestProvider } from "../src";

const mockAdapter = new MockAdapter(axios);

const AllTheProviders: FC = ({ children }) => (
  <RequestProvider value={axios}>{children}</RequestProvider>
);

function customRenderHook<P, R>(
  callback: (props: P) => R,
  options?: RenderHookOptions<P>,
) {
  return renderHook<P, R>(callback, {
    wrapper: AllTheProviders,
    ...options,
  });
}

export * from "@testing-library/react-hooks";

export { customRenderHook as renderHook, mockAdapter };
