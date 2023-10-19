English | [简体中文](./README.zh-CN.md)

<br>
<p align="center">
<a href="https://github.com/axios-use/react#gh-light-mode-only">
  <img src="https://raw.githubusercontent.com/axios-use/react/main/other/axios-use-react.png#gh-light-mode-only" alt="@axios-use/react - A React hook plugin for Axios. Lightweight and less change." width="460">
</a>
<a href="https://github.com/axios-use/react#gh-dark-mode-only">
  <img src="https://raw.githubusercontent.com/axios-use/react/main/other/axios-use-react-dark.png#gh-dark-mode-only" alt="@axios-use/react - A React hook plugin for Axios. Lightweight and less change." width="460">
</a>
<br>
A React hook plugin for Axios. Lightweight, cancelable and less change.
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@axios-use/react" target="__blank"><img src="https://img.shields.io/npm/v/@axios-use/react.svg" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/@react-cmpt/react-request-hook" target="__blank"><img src="https://img.shields.io/badge/old%20version-v5.1.0-inactive.svg" alt="NPM old version"></a>
<a href="https://packagephobia.com/result?p=%40axios-use%2Freact" target="__blank"><img src="https://badgen.net/packagephobia/install/@axios-use/react" alt="install size"></a>
<a href="https://bundlephobia.com/package/@axios-use/react" target="__blank"><img src="https://badgen.net/bundlephobia/minzip/@axios-use/react" alt="minzipped size"></a>
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

## Usage

### Quick Start

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

#### RequestProvider config

| config               | type            | explain                                                    |
| -------------------- | --------------- | ---------------------------------------------------------- |
| instance             | object          | axios instance                                             |
| cache                | object \| false | Customized cache collections. Or close. (**Default on**)   |
| cacheKey             | function        | Global custom formatted cache keys                         |
| cacheFilter          | function        | Global callback function to decide whether to cache or not |
| customCreateReqError | function        | Custom format error data                                   |

### useRequest

| option              | type            | explain                                          |
| ------------------- | --------------- | ------------------------------------------------ |
| fn                  | function        | get AxiosRequestConfig function                  |
| options.onCompleted | function        | This function is passed the query's result data. |
| options.onError     | function        | This function is passed an `RequestError` object |
| options.instance    | `AxiosInstance` | Customize the Axios instance of the current item |

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

| option               | type                        | explain                                                             |
| -------------------- | --------------------------- | ------------------------------------------------------------------- |
| fn                   | function                    | get AxiosRequestConfig function                                     |
| parameters           | array \| false              | `fn` function parameters. effect dependency list                    |
| options.cache        | object \| false             | Customized cache collections. Or close                              |
| options.cacheKey     | string\| number \| function | Custom cache key value                                              |
| options.cacheFilter  | function                    | Callback function to decide whether to cache or not                 |
| options.filter       | function                    | Request filter. if return a falsy value, will not start the request |
| options.defaultState | object                      | Initialize the state value. `{data, response, error, isLoading}`    |
| options.onCompleted  | function                    | This function is passed the query's result data.                    |
| options.onError      | function                    | This function is passed an `RequestError` object                    |
| options.instance     | `AxiosInstance`             | Customize the Axios instance of the current item                    |

```tsx
// js
const [{ data, error, isLoading }, fetch, refresh] = useResource((id) => ({
  url: `/user/${id}`,
  method: "GET",
}));

// tsx
const [reqState, fetch, refresh] = useResource((id: string) =>
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

// `options.filter` will not be called
type Fetch = (...args: Parameters<TRequest>) => Canceler;

// 1. Same as `fetch`. But no parameters required. Inherit `useResource` parameters
// 2. Will call `options.filter`
type Refresh = () => Canceler | undefined;
```

The request can also be triggered passing its arguments as dependencies to the _useResource_ hook.

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

### other

#### request

The `request` function allows you to define the response type coming from it. It also helps with creating a good pattern on defining your API calls and the expected results. It's just an identity function that accepts the request config and returns it. Both `useRequest` and `useResource` extract the expected and annotated type definition and resolve it on the `response.data` field.

```tsx
const api = {
  getUsers: () => {
    return request<Users>({
      url: "/users",
      method: "GET",
    });
  },

  getUserInfo: (userId: string) => {
    return request<UserInfo>({
      url: `/users/${userId}`,
      method: "GET",
    });
  },
};
```

You can also use these `request` functions directly in `axios`.

```ts
const usersRes = await axios(api.getUsers());

const userRes = await axios(api.getUserInfo("ID001"));
```

custom response type. (if you change the response's return value. like axios.interceptors.response)

```ts
import { request, _request } from "@axios-use/react";
const [reqState] = useResource(() => request<DataType>({ url: `/users` }), []);
// AxiosResponse<DataType>
reqState.response;
// DataType
reqState.data;

// custom response type
const [reqState] = useResource(() => _request<MyWrapper<DataType>>({ url: `/users` }), []);
// MyWrapper<DataType>
reqState.response;
// MyWrapper<DataType>["data"]. maybe `undefined` type.
reqState.data;
```

#### createRequestError

The `createRequestError` normalizes the error response. This function is used internally as well. The `isCancel` flag is returned, so you don't have to call **axios.isCancel** later on the promise catch block.

```tsx
interface RequestError<T> {
  data?: T;
  message: string;
  code?: string | number;
  isCancel: boolean;
  original: AxiosError<T>;
}
```

## License

[MIT](./LICENSE)
