# react-request-hook

> Managed, cancelable and safely typed requests.

[![npm](https://img.shields.io/npm/v/@react-cmpt/react-request-hook.svg)](https://www.npmjs.com/package/@react-cmpt/react-request-hook)
[![GitHub license](https://img.shields.io/github/license/react-cmpt/react-request-hook)](https://github.com/react-cmpt/react-request-hook/blob/master/LICENSE)

Fork: https://github.com/schettino/react-request-hook

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [`useResource`](#useresource)
  - [`useRequest`](#userequest)
  - [`request()`](#request)
  - [`createRequestError()`](#createrequesterror)
- [Type safety for non typescript projects](#type-safety-for-non-typescript-projects)
- [License](#license)

## Install

```bash
# Yarn
yarn add axios @react-cmpt/react-request-hook
```

## Quick Start

```jsx
import { RequestProvider } from "@react-cmpt/react-request-hook";
import axios from "axios";

// More info about configuration: https://github.com/axios/axios#axioscreateconfig
const axiosInstance = axios.create({
  baseURL: "https://example.com/",
});

ReactDOM.render(
  <RequestProvider value={axiosInstance}>
    <App />
  </RequestProvider>,
  document.getElementById("root"),
);
```

```jsx
// User Profile component
function UserProfile(props) {
  const [profile, getProfile] = useResource((id) => ({
    url: `/user/${id}`,
    method: "GET",
  }));

  useEffect(() => getProfile(props.userId), []);

  if (profile.isLoading) return <Spinner />;

  return (
    <ProfileScreen
      avatar={profile.data.avatar}
      email={profile.data.email}
      name={profile.data.name}
    />
  );
}
```

## Usage

### useResource

The `useResource` hook manages the request state under the hood. Its high-level API allows one request to be made at a time. Subsequent requests cancel the previous ones, leaving the call to be made with the most recent data available. The API is intended to be similar to `useState` and `useEffect`.

It requires a function as the first argument that is just a [request config][axios-request-config] factory and returns a tuple with the resource state and a function to trigger the request call, which accepts the same arguments as the factory one.

```tsx
const [comments, getComments] = useResource((id) => ({
  url: `/post/${id}/comments`,
  method: "get",
}));
```

The request function returns a canceler that allows you to easily cancel a request on a cleaning phase of a hook.

```tsx
useEffect(() => {
  if (props.isDialogOpen) {
    return getComments(props.postId);
  }
}, [props.isDialogOpen]);
```

```tsx
interface Resource {
  isLoading: boolean;

  // same as `response.data` resolved from the axios promise
  data: Payload<Request> | null;

  // Shortcut function to cancel a pending request
  cancel: (message?: string) => void;

  // normalized error
  error: RequestError | null;
}
```

The request can also be triggered passing its arguments as dependencies to the _useResource_ hook.

```tsx
const [comments] = useResource(
  (id: string) => ({
    url: `/post/${id}/comments`,
    method: "get",
  }),
  [props.postId],
);
```

It has the same behavior as `useEffect`. Changing those values triggers another request and cancels the previous one if it's still pending.

If you want more control over the request calls or the ability to call multiple requests from the same resource or not at the same time, you can rely on the **useRequest** hook.

### useRequest

This hook is used internally by **useResource**. It's responsible for creating the request function and manage the cancel tokens that are being created on each of its calls. This hook also normalizes the error response (if any) and provides a helper that cancel all pending request.

It accepts the same function signature as `useResource` (a function that returns an object with the Axios request config).

```tsx
const [request, createRequest] = useRequest((id: string) => ({
  url: `/post/${id}/comments`,
  method: "get",
}));
```

```tsx
interface CreateRequest {
  // same args used on the callback provided to the hook
  (...args): {
    // cancel the requests created on this factory
    cancel: (message?: string) => void;

    ready: () => Promise;
  };
}

interface Request {
  hasPending: boolean;

  // clear all pending requests
  clear: (message?: string) => void;
}
```

By using it, you're responsible for handling the promise resolution. It's still canceling pending requests when unmounting the component.

```tsx
useEffect(() => {
  const { ready, cancel } = createRequest(props.postId);
  ready()
    .then(setState)
    .catch((error) => {
      if (error.isCancel === false) {
        setError(error);
      }
    });
  return cancel;
}, [props.postId]);
```

### request

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
    return request<Posts>({
      url: `/users/${userId}/posts`,
      method: "GET",
    });
  },
};
```

### createRequestError

The `createRequestError` normalizes the error response. This function is used internally as well. The `isCancel` flag is returned, so you don't have to call **axios.isCancel** later on the promise catch block.

```tsx
interface RequestError {
  // same as `response.data`, where response is the object coming from the axios promise
  data: Payload<Request>;

  message: Error["message"];

  // code on the `data` field, `error.code` or `error.response.status`
  // in the order
  code: number | string;
}
```

## Type safety for non typescript projects

This library is entirely written in typescript, so depending on your editor you might have all the type hints out of the box. However, we also provide a payload field to be attached to the request config object, which allows you to define and use the typings for the payload of a given request. We believe that this motivates a better and clean code as we're dealing with some of the most substantial parts of our app implementation.

```js
const api = {
  getUsers: () => {
    return {
      url: '/users',
      method: 'GET',
      payload: [{
        id: String(),
        age: Number(),
        likesVideoGame: Boolean(),
      }],
    });
  },
};
```

## License

[MIT](./LICENSE)
