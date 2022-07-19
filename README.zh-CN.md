简体中文 | [English](./README.md)

<br>
<p align="center">
<a href="https://github.com/axios-use/react#gh-light-mode-only">
  <img src="https://raw.githubusercontent.com/axios-use/react/main/other/axios-use-react.png#gh-light-mode-only" alt="@axios-use/react - 一个 Axios 的 React Hook 插件，小而美" width="460">
</a>
<a href="https://github.com/axios-use/react#gh-dark-mode-only">
  <img src="https://raw.githubusercontent.com/axios-use/react/main/other/axios-use-react-dark.png#gh-dark-mode-only" alt="@axios-use/react - 一个 Axios 的 React Hook 插件，小而美" width="460">
</a>
<br>
一个 Axios 的 React Hook 插件，小而美
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@axios-use/react" target="__blank"><img src="https://img.shields.io/npm/v/@axios-use/react.svg" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/@react-cmpt/react-request-hook" target="__blank"><img src="https://img.shields.io/badge/old%20version-v5.1.0-inactive.svg" alt="NPM old version"></a>
<a href="https://github.com/axios-use/react/actions?query=workflow%3ACI" target="__blank"><img src="https://github.com/axios-use/react/workflows/CI/badge.svg" alt="ci"></a>
<a href="https://github.com/axios-use/react/blob/main/LICENSE" target="__blank"><img src="https://img.shields.io/github/license/axios-use/react" alt="license"></a>
</p>
<br>
<br>

<div align="center">
<pre>npm i <a href="https://www.npmjs.com/package/axios">axios</a> <a href="https://www.npmjs.com/package/@axios-use/react"><b>@axios-use/react</b></a></pre>
</div>
<br>
<br>

## 使用

### 快速开始

```js
import { useResource } from "@axios-use/react";

function Profile({ userId }) {
  const [{ data, error, isLoading }] = useResource((id) => ({ url: `/user/${id}` }), [userId]);

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  return <div>hello {data.name}!</div>;
}
```

```tsx
import { useRequest, useResource } from "@axios-use/react";
```

### RequestProvider

```tsx
import axios from "axios";
import { RequestProvider } from "@axios-use/react";

// custom Axios instance. https://github.com/axios/axios#creating-an-instance
const axiosInstance = axios.create({
  baseURL: "https://example.com/",
});

ReactDOM.render(
  // custom instance
  <RequestProvider instance={axiosInstance}>
    <App />
  </RequestProvider>,
  document.getElementById("root"),
);
```

#### RequestProvider 配置

| config               | type            | explain                                                    |
| -------------------- | --------------- | ---------------------------------------------------------- |
| instance             | object          | 自定义 Provider 下的 Axios 实例                            |
| cache                | object \| false | 自定义 Provider 下的 Cache 对象，或关闭。 (**默认开启**)   |
| cacheKey             | function        | 自定义 Provider 下的生成 Cache key 函数                    |
| cacheFilter          | function        | 缓存筛选器，自定义 Provider 下的过滤响应缓存，决定是否存储 |
| customCreateReqError | function        | 自定义 Provider 下的格式化错误响应                         |

### useRequest

| option              | type            | explain                   |
| ------------------- | --------------- | ------------------------- |
| fn                  | function        | 传递 Axios 请求配置的函数 |
| options.onCompleted | function        | 请求成功的回调函数        |
| options.onError     | function        | 请求失败的回调函数        |
| options.instance    | `AxiosInstance` | 自定义当前项的 Axios 实例 |

```tsx
// js
const [createRequest, { hasPending, cancel }] = useRequest((id) => ({
  url: `/user/${id}`,
  method: "DELETE",
}));

// tsx
const [createRequest, { hasPending, cancel }] = useRequest((id: string) =>
  // response.data: Result. AxiosResponse<Result>
  request<Result>({
    url: `/user/${id}`,
    method: "DELETE",
  }),
);
```

```tsx
interface CreateRequest {
  // Promise function
  ready: () => Promise<[Payload<TRequest>, AxiosResponse]>;
  // Axios Canceler. clear current request.
  cancel: Canceler;
}

type HasPending = boolean;
// Axios Canceler. clear all pending requests(CancelTokenSource).
type Cancel = Canceler;
```

```jsx
useEffect(() => {
  const { ready, cancel } = createRequest(id);

  ready()
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });
  return cancel;
}, [id]);
```

```tsx
// options: onCompleted, onError
const [createRequest, { hasPending, cancel }] = useRequest(
  (id) => ({
    url: `/user/${id}`,
    method: "DELETE",
  }),
  {
    onCompleted: (data, response) => console.info(data, response),
    onError: (err) => console.info(err),
  },
);
```

### useResource

| option               | type                        | explain                                                               |
| -------------------- | --------------------------- | --------------------------------------------------------------------- |
| fn                   | function                    | 传递 Axios 请求配置的函数                                             |
| parameters           | array \| false              | 传递 Axios 配置函数参数的数组对象，effect 依赖项。`false`关闭依赖响应 |
| options.cache        | object \| false             | 自定义 Cache 对象，或关闭。 (**默认继承全局**)                        |
| options.cacheKey     | string\| number \| function | 自定义生成 Cache key 函数                                             |
| options.cacheFilter  | function                    | 缓存筛选器，自定义过滤响应缓存，决定是否存储                          |
| options.filter       | function                    | 请求筛选器，决定是否发起请求                                          |
| options.defaultState | object                      | State 的初始化值. `{data, response, error, isLoading}`                |
| options.onCompleted  | function                    | 请求成功的回调函数                                                    |
| options.onError      | function                    | 请求失败的回调函数                                                    |
| options.instance     | `AxiosInstance`             | 自定义当前项的 Axios 实例                                             |

```tsx
// js
const [{ data, error, isLoading }, fetch] = useResource((id) => ({
  url: `/user/${id}`,
  method: "GET",
}));

// tsx
const [reqState, fetch] = useResource((id: string) =>
  // response.data: Result. AxiosResponse<Result>
  request<Result>({
    url: `/user/${id}`,
    method: "GET",
  }),
);
```

```tsx
interface ReqState {
  // Result
  data?: Payload<TRequest>;
  // axios response
  response?: AxiosResponse;
  // normalized error
  error?: RequestError<Payload<TRequest>>;
  isLoading: boolean;
  cancel: Canceler;
}

type Fetch = (...args: Parameters<TRequest>) => Canceler;
```

将其参数作为依赖项传递给 `useResource`，根据参数变化自动触发请求

```jsx
const [userId, setUserId] = useState();

const [reqState] = useResource(
  (id) => ({
    url: `/user/${id}`,
    method: "GET",
  }),
  [userId],
);

// no parameters
const [reqState] = useResource(
  () => ({
    url: "/users/",
    method: "GET",
  }),
  [],
);

// conditional
const [reqState, request] = useResource(
  (id) => ({
    url: `/user/${id}`,
    method: "GET",
  }),
  [userId],
  {
    filter: (id) => id !== "12345",
  },
);

request("12345"); // custom request is still useful

// options: onCompleted, onError
const [reqState] = useResource(
  () => ({
    url: "/users/",
    method: "GET",
  }),
  [],
  {
    onCompleted: (data, response) => console.info(data, response),
    onError: (err) => console.info(err),
  },
);
```

#### cache

https://codesandbox.io/s/react-request-hook-cache-9o2hz

### 其他

#### request

`request` 作用于 Typescript 类型推导，便于识别 response 类型

```ts
export function request<T, D = any>(config: AxiosRequestConfig<D>): Resource<T, D>;
```

```tsx
const api = {
  getUsers: () => {
    return request<Users>({
      url: "/users",
      method: "GET",
    });
  },

  getUserPosts: (userId: string) => {
    return request<UserInfo>({
      url: `/users/${userId}`,
      method: "GET",
    });
  },
};
```

你也可以直接通过 `request` 函数直接发出 HTTP 请求

```ts
function request<T, D = any>(config: AxiosRequestConfig<D>, instance: AxiosInstance | true): AxiosPromise<T>;
```

```ts
const res = await request({ url: "/users" }, true);

// 自定义 axios instance
const res = await request({ url: "/users" }, customIns);
```

#### createRequestError

`createRequestError` 用于规范错误响应（该函数也默认在内部调用）。 `isCancel` 标志被返回，因此也不必在 promise catch 块上调用 **axios.isCancel**。

```tsx
interface RequestError<T> {
  data?: T;
  message: string;
  code?: string | number;
  isCancel: boolean;
  original: AxiosError<T>;
}
```

## 许可证

[MIT](./LICENSE)
