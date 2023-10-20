import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type { Payload, Resource } from "../src";
import { _request, request, createRequestError } from "../src";
import { expectTypeShell } from "./utils";

const config1 = { url: "/config1", method: "GET" } as AxiosRequestConfig;
const config2 = {
  url: "/config2",
  method: "GET",
  params: { page: 2, size: 10 },
} as AxiosRequestConfig;

describe("request", () => {
  it("should be defined", () => {
    expect(_request).toBeDefined();
    expect(request).toBeDefined();
  });

  it("value", () => {
    expect(_request(config1)).toStrictEqual(config1);
    expect(_request(config2)).toStrictEqual(config2);
    expect(request(config1)).toStrictEqual(config1);
    expect(request(config2)).toStrictEqual(config2);
  });

  it("type checking", () => {
    type DataType = { a: string; b?: number };
    type ItemType = { z: string[] };
    type DataType2 = DataType & { data?: ItemType };
    const rq0 = () => _request<DataType>({});
    const rq1 = () => request<DataType>({});
    const rq2 = () => _request<DataType2>({});

    expect(
      expectTypeShell(rq0()).type<Resource<DataType, any>>(),
    ).toBeDefined();
    expect(
      expectTypeShell(rq1()).type<Resource<AxiosResponse<DataType>, any>>(),
    ).toBeDefined();

    const c0 = null as unknown as Payload<typeof rq0>;
    expect(expectTypeShell(c0).type<DataType | undefined>()).toBeNull();
    const c1 = null as unknown as Payload<typeof rq0, true>;
    expect(expectTypeShell(c1).type<undefined>()).toBeNull();

    const c2 = null as unknown as Payload<typeof rq1>;
    expect(expectTypeShell(c2).type<AxiosResponse<DataType, any>>()).toBeNull();
    const c3 = null as unknown as Payload<typeof rq1, true>;
    expect(expectTypeShell(c3).type<DataType | undefined>()).toBeNull();

    const c4 = null as unknown as Payload<typeof rq2>;
    expect(expectTypeShell(c4).type<DataType2 | undefined>()).toBeNull();
    const c5 = null as unknown as Payload<typeof rq2, true>;
    expect(expectTypeShell(c5).type<ItemType | undefined>()).toBeNull();
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
    expect(createRequestError(err3 as any).original).toStrictEqual(err3);

    const err4 = {
      status: 400,
    };
    expect(createRequestError(err4 as any).code).toEqual(400);
    expect(createRequestError(err4 as any).data).toBeUndefined();
    expect(createRequestError(err4 as any).original).toStrictEqual(err4);

    expect(createRequestError(undefined as any).code).toBeUndefined();
    expect(createRequestError(undefined as any).data).toBeUndefined();
    expect(createRequestError(undefined as any).original).toBeUndefined();
  });
});
