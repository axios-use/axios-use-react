import type { AxiosRequestConfig } from "axios";
import { request, createRequestError } from "../src";

import { mockAdapter, axios } from "./utils";

const config1 = { url: "/config1", method: "GET" } as AxiosRequestConfig;
const config2 = {
  url: "/config2",
  method: "GET",
  params: { page: 2, size: 10 },
} as AxiosRequestConfig;

describe("request", () => {
  it("should be defined", () => {
    expect(request).toBeDefined();
  });

  it("value", () => {
    expect(request(config1)).toStrictEqual(config1);
    expect(request(config2)).toStrictEqual(config2);
  });
});

describe("createRequestError", () => {
  it("should be defined", () => {
    expect(createRequestError).toBeDefined();
  });

  it("value", () => {
    const err1 = {
      config: config1,
      code: 401,
      response: { data: [1, 2], status: 400 },
    };
    expect(createRequestError(err1 as any).code).toEqual(err1.code);
    expect(createRequestError(err1 as any).data).toEqual(err1.response?.data);
    expect(createRequestError(err1 as any).isCancel).toBeFalsy();

    const err2 = {
      config: config1,
      code: 401,
      response: { data: { code: 2001, data: [1, 2] }, status: 400 },
    };
    expect(createRequestError(err2 as any).code).toEqual(
      err2.response?.data?.code,
    );
    expect(createRequestError(err2 as any).data).toEqual(err2.response?.data);
    expect(createRequestError(err2 as any).isCancel).toBeFalsy();

    const err3 = {
      config: config1,
      response: { status: 400 },
    };
    expect(createRequestError(err3 as any).code).toEqual(400);
    expect(createRequestError(err3 as any).data).toBeUndefined();

    expect(createRequestError(undefined as any).code).toBeUndefined();
    expect(createRequestError(undefined as any).data).toBeUndefined();
    expect(createRequestError(undefined as any).original).toBeUndefined();
  });
});

describe("request promise", () => {
  beforeAll(() => {
    mockAdapter.onGet("/gethello").reply((config) => {
      if (config.headers?.["xxxkey"] === "custom") {
        return [200, "custom"];
      }
      return [200, "hello"];
    });
    mockAdapter.onPost("/post").reply((config) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return [200, { data: JSON.parse(config.data) }];
    });
  });

  it("instance true", async () => {
    const res = await request<string>({ url: "/gethello" }, true);

    expect(res.data).toBe("hello");
  });

  it("instance custom", async () => {
    const instance = axios.create({
      headers: {
        xxxkey: "custom",
      },
    });
    const res = await request<string>({ url: "/gethello" }, instance);

    expect(res.data).toBe("custom");
  });

  it("check response type", async () => {
    type Res = {
      data?: {
        demo: string;
      };
    };
    const body: Res["data"] = { demo: "hello" };

    const res = await request<Res>(
      { method: "post", url: "/post", data: body },
      true,
    );

    expect(res.data?.data?.demo).toBe("hello");
  });
});
