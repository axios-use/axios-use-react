# react-request-hook

> A React hook plugin for Axios. Lightweight and less change.

[![CI](https://github.com/react-cmpt/react-request-hook/workflows/CI/badge.svg)](https://github.com/react-cmpt/react-request-hook/actions?query=workflow%3ACI)
[![npm](https://img.shields.io/npm/v/@react-cmpt/react-request-hook.svg)](https://www.npmjs.com/package/@react-cmpt/react-request-hook)
[![GitHub license](https://img.shields.io/github/license/react-cmpt/react-request-hook)](https://github.com/react-cmpt/react-request-hook/blob/master/LICENSE)

Fork: https://github.com/schettino/react-request-hook

## Usage

### Quick Start

```js
import { useResource } from "@react-cmpt/react-request-hook";

function Profile() {
  const [{ data, error, isLoading }] = useResource((id) => ({ url: `/user/${id}` }));

  if (error) return <div>failed to load</div>;
  if (isLoading) return <div>loading...</div>;
  return <div>hello {data.name}!</div>;
}
```

### installation

```shell
yarn add axios @react-cmpt/react-request-hook
```

### setup

```tsx
import axios from "axios";
import { RequestProvider } from "@react-cmpt/react-request-hook";

// https://github.com/axios/axios#creating-an-instance
const axiosInstance = axios.create({
  baseURL: "https://example.com/",
});

ReactDOM.render(
  <RequestProvider instance={axiosInstance}>
    <App />
  </RequestProvider>,
  document.getElementById("root"),
);
```

```tsx
import { useRequest, useResource } from "@react-cmpt/react-request-hook";
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

| option              | type     | explain                                          |
| ------------------- | -------- | ------------------------------------------------ |
| fn                  | function | get AxiosRequestConfig function                  |
| options.onCompleted | function | This function is passed the query's result data. |
| options.onError     | function | This function is passed an `RequestError` object |

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
  ready: () => Promise<[Payload<TRequest>, AxiosRestResponse]>;
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
    onCompleted: (data, other) => console.info(data, other),
    onError: (err) => console.info(err),
  },
);
```

### useResource

| option               | type                        | explain                                                             |
| -------------------- | --------------------------- | ------------------------------------------------------------------- |
| fn                   | function                    | get AxiosRequestConfig function                                     |
| parameters           | array                       | `fn` function parameters. effect dependency list                    |
| options.cache        | object \| false             | Customized cache collections. Or close                              |
| options.cacheKey     | string\| number \| function | Custom cache key value                                              |
| options.cacheFilter  | function                    | Callback function to decide whether to cache or not                 |
| options.filter       | function                    | Request filter. if return a falsy value, will not start the request |
| options.defaultState | object                      | Initialize the state value. `{data, other, error, isLoading}`       |
| options.onCompleted  | function                    | This function is passed the query's result data.                    |
| options.onError      | function                    | This function is passed an `RequestError` object                    |

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
  // other axios response. Omit<AxiosResponse, "data">
  other?: AxiosRestResponse;
  // normalized error
  error?: RequestError<Payload<TRequest>>;
  isLoading: boolean;
  cancel: Canceler;
}

type Fetch = (...args: Parameters<TRequest>) => Canceler;
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
    onCompleted: (data, other) => console.info(data, other),
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

  getUserPosts: (userId: string) => {
    return request<UserInfo>({
      url: `/users/${userId}`,
      method: "GET",
    });
  },
};
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
