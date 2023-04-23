## [6.4.0](https://github.com/axios-use/react/compare/v6.4.0...v6.4.1) (2023-04-23)


### Bug Fixes

* **type:** `onCompleted` response generic error. ([aed68bf](https://github.com/axios-use/react/commit/aed68bfb8b5072a77197c29edd1c5b8773cc5ed8))



## [6.4.0](https://github.com/axios-use/react/compare/v6.3.0...v6.4.0) (2023-03-26)


### Bug Fixes

* **createRequestError:** value num 0. ([84a3084](https://github.com/axios-use/react/commit/84a3084c49be5175fcbeb72c9c987cc6ba46c3be))


### Features

* **cache:** use ttl cache by default. ([#19](https://github.com/axios-use/react/pull/19))
* **onCompleted types:** parameters is required. ([96f1f8d](https://github.com/axios-use/react/commit/96f1f8d8fd7b8a2b245fb310ff09a9c6d5baa6ad))
* **CData type:** replace `CData` width `BodyData`. ([5f26f42](https://github.com/axios-use/react/commit/5f26f4221e120e9e7ecae362f4ef303601a3a825))

  No BREAKING CHANGES. Will keep `CData` type, but deprecated.



## [6.3.0](https://github.com/axios-use/react/compare/v6.2.0...v6.3.0) (2022-12-05)


### Bug Fixes

* **useResource:** catch `fnOptions` undefined error. ([bd74a59](https://github.com/axios-use/react/commit/bd74a59bb100543190a935c65d194983ecc5cfa7))


### Chore

* Upgrade devDependencies. (axios v1 [#17](https://github.com/axios-use/react/pull/17))



## [6.2.0](https://github.com/axios-use/react/compare/v6.1.0...v6.2.0) (2022-08-23)


### Bug Fixes

* **types:** ready return type (RequestFactory). ([1407056](https://github.com/axios-use/react/commit/140705628a9f503fde9aa3a47be6fae8ecfc49d0))


### Features

* **useResource:** return refresh func. ([f6e7692](https://github.com/axios-use/react/commit/f6e7692123a007c0a77f59bc9d8c8b32f52fc566))
  ```diff
  - const [reqState, fetch] = useResource();
  + const [reqState, fetch, refresh] = useResource();
  ```



## [6.1.0](https://github.com/axios-use/react/compare/v6.0.0...v6.1.0) (2022-07-05)


### Features

* feat(useRequest): return all response. ([e9317ce](https://github.com/axios-use/react/commit/e9317ce246a0c286c6e548d2f153dbc2cd8411b6))
  ```diff
  interface CreateRequest {
    // Promise function
  - ready: () => Promise<[Payload<TRequest>, AxiosRestResponse]>;
  + ready: () => Promise<[Payload<TRequest>, AxiosResponse]>;
    // Axios Canceler. clear current request.
    cancel: Canceler;
  }
  ```

  ```diff
  - const [{ data, error, isLoading, other }] = useResource(...)
  + const [{ data, error, isLoading, response }] = useResource(...)
  ```

No BREAKING CHANGES. Will keep `other` value, but deprecated.



# [6.0.0](https://github.com/axios-use/react/compare/v5.1.0...v6.0.0) (2022-05-15)


### BREAKING CHANGES
You must update all imports from '@react-cmpt/react-request-hook' to '@axios-use/react'

🚨🚨🚨 Find/replace `@react-cmpt/react-request-hook` for `@axios-use/react` and upgrade to v6


### Features

* Customize the Axios instance of the current item. ([#10](https://github.com/axios-use/react/pull/10))
  ```tsx
  const customIns = axios.create({
    // ...
  });

  function Profile({ userId }) {
    const [{ data, error, isLoading }] = useResource(
      (id) => ({ url: `/user/${id}` }),
      [userId],
      { instance: customIns },
    );

    // ...
  }
  ```
* **useResource:** requestParams type can be `false`. ([887aabc](https://github.com/axios-use/react/commit/887aabcf45f3c8e1410fcff3ffc4371de511aef3))


### Chore

* Upgrade devDependencies. (Typescript 4.6 [0d2b6ed](https://github.com/axios-use/react/commit/0d2b6ed6df308e67462b4852f86ec6f3bd4a8df5), React 18 [70e53cd](https://github.com/axios-use/react/commit/70e53cd7a1f6b700f6a0a78ad3c86fa7c3b5f731))


## [5.1.0](https://github.com/react-cmpt/react-request-hook/compare/v5.0.1...v5.1.0) (2022-02-13)


### Features

* **RequestProvider:** `RequestProvider` is optional. You can use `useRequest`, `useResource` directly. ([afd0e40](https://github.com/react-cmpt/react-request-hook/commit/afd0e40011a1480c2710e062cd9e9614d92050af))



## [5.0.1](https://github.com/react-cmpt/react-request-hook/compare/v5.0.0...v5.0.1) (2021-12-16)


### Chore

* peerDependencies: axios version >= 0.21.4. (for `AxiosRequestConfig` genericity ) ([fe6ac4e](https://github.com/react-cmpt/react-request-hook/commit/fe6ac4ea1befe668665fb8da8f8cf5486186f4d9))



# [5.0.0](https://github.com/react-cmpt/react-request-hook/compare/v4.3.0...v5.0.0) (2021-12-08)


### Features

* **RequestContext:** `customCreateReqError` function. ([#5](https://github.com/react-cmpt/react-request-hook/pull/5))
* **useResource:** defaultState options. ([4cc6643](https://github.com/react-cmpt/react-request-hook/commit/4cc6643aa6c4247a4c5493c13f75c54b651cc3df))
* **useRequest/useResource:** onCompleted, onError options. ([#6](https://github.com/react-cmpt/react-request-hook/pull/6))
  ```ts
  // useRequest
  const [createRequest, { hasPending, cancel }] = useRequest(
    (id) => ({ url: `/user/${id}`, method: "DELETE" }),
    {
      onCompleted: (data, other) => console.info(data, other),
      onError: (err) => console.info(err),
    },
  );
  // useResource
  const [{ data, isLoading, error }] = useResource(
    () => ({ url: "/users/", method: "GET" }),
    [],
    {
      onCompleted: (data, other) => console.info(data, other),
      onError: (err) => console.info(err),
    },
  );
  ```


### Bug Fixes

* **useResource:** default isLoading value when using filter (state). ([4fb4f6d](https://github.com/react-cmpt/react-request-hook/commit/4fb4f6dc3a50a4eeda443f0aa13f9b2358c843f1))



## [4.3.0](https://github.com/react-cmpt/react-request-hook/compare/v4.2.0...v4.3.0) (2021-11-24)


### Features

* Type: keep AxiosRequestConfig generics. ([#4](https://github.com/react-cmpt/react-request-hook/pull/4))



## [4.2.0](https://github.com/react-cmpt/react-request-hook/compare/v4.1.0...v4.2.0) (2021-10-15)


### Bug Fixes

* Unsafe argument of type. ([f41e627](https://github.com/react-cmpt/react-request-hook/commit/f41e627dd18d43e99c557e8008ef946b1b239a0c))


### Building

* Support react version < 17. tsconfig.compilerOptions.jsx `react-jsx` -> `react`. ([60a762e](https://github.com/react-cmpt/react-request-hook/commit/60a762e95b2d5cd7fab9575b2c543bd80784eaca))


### Chore

* Upgrade devDependencies. ([74ba658](https://github.com/react-cmpt/react-request-hook/commit/74ba658208953640a41df78ac29d5473faf8124e), [ef26c9e](https://github.com/react-cmpt/react-request-hook/commit/ef26c9ec0f641528a4b06ddd19e6e84c3fc9e871), [fb082ad](https://github.com/react-cmpt/react-request-hook/commit/fb082ad47790b1867c32eda5c90505d59107b8b2))



## [4.1.0](https://github.com/react-cmpt/react-request-hook/compare/v4.0.0...v4.1.0) (2021-08-23)


### Features

* **useResource:** options `filter`. if return a falsy value, will not start the request. ([#3](https://github.com/react-cmpt/react-request-hook/pull/3))
  ```tsx
  filter?: (...args: Parameters<T>) => boolean;
  ```
* **UseResourceOptions** genericity ([b2b0501](https://github.com/react-cmpt/react-request-hook/commits/b2b05016f12f14773bd87fa519f808604fdbbda6))
  ```diff
  - UseResourceOptions<Payload<TRequest>>
  + UseResourceOptions<TRequest>
  ```


### Chore

* Upgrade devDependencies.([ea41057](https://github.com/react-cmpt/react-request-hook/commit/ea41057b8e626dcdc18c7961e4a9f2f9737cc7d8), [bf6fb89](https://github.com/react-cmpt/react-request-hook/commit/bf6fb890bebd9ab36de7f110811e796e7912414d))



# [4.0.0](https://github.com/react-cmpt/react-request-hook/compare/v3.0.0...v4.0.0) (2021-06-02)


### Features

* **useResource:** Use cache initialization state ([#2](https://github.com/react-cmpt/react-request-hook/pull/2))
* **context:** separate the values of provider(props) ([35ea8a2](https://github.com/react-cmpt/react-request-hook/commit/35ea8a2b01affbbe17867ada2d541089b7c15277))
  ```diff
  - <RequestProvider value={axiosInstance}>
  + <RequestProvider instance={axiosInstance}>
      <App />
    </RequestProvider>,
  ```
* **type:** split with RequestContextConfig (null) ([fd91fcb](https://github.com/react-cmpt/react-request-hook/commit/fd91fcb7d7832778034c83ce965f12c58d2eaea0))
  ```tsx
  export type RequestContextConfig<T = any> = {
    instance?: AxiosInstance;
    cache?: Cache<T> | false;
    cacheKey?: CacheKeyFn<T>;
    cacheFilter?: CacheFilter<T>;
  };

  export type RequestContextValue<T = any> = RequestContextConfig<T> | null;
  ```



# [3.0.0](https://github.com/react-cmpt/react-request-hook/compare/v2.2.2...v3.0.0) (2021-01-03)


### Features (BREAKING CHANGES)

* **useRequest:** swap returns ([7169e9e](https://github.com/react-cmpt/react-request-hook/commit/7169e9e5fd1fbb4d89f1f8b729d7bb773545f1cc))
   ```tsx
   // before
   const [request, createRequest] = useRequest(...);
   // now
   const [createRequest, request] = useRequest(...);
   ```
* return other responses ([3924e0c](https://github.com/react-cmpt/react-request-hook/commit/3924e0cb67e66155702ff1ea6d113a2f69f462b5))
  ```tsx
  const [createRequest] = useRequest(...);
  
  const fetch = async () => {
    // before
    const response = await createRequest.ready();

    // now. [T, Omit<AxiosResponse<T>, "data">]
    const [response, otherAxiosReponse] = await createRequest.ready();
  }
  ```
  ```tsx
  // before
  const [{ data, error, isLoading, cancel }] = useResource(...);
  
  // now. other: Omit<AxiosResponse, "data">
  const [{ data, other, error, isLoading, cancel }] = useResource(...);
  ```



## [2.2.2](https://github.com/react-cmpt/react-request-hook/compare/v2.2.1...v2.2.2) (2020-12-27)


### Building

* To ensure compatibility in the emitted JavaScript. (`esModuleInterop`, `allowSyntheticDefault`) (for dependencies) ([b62273f](https://github.com/react-cmpt/react-request-hook/commit/b62273f4c84678a515cf0b07e6ac620a6245e852))
 

## [2.2.1](https://github.com/react-cmpt/react-request-hook/compare/v2.2.0...v2.2.1) (2020-12-25)


### Building

* Not allow Synthetic Default Imports. (for `fast-deep-equal`) ([645d2c2](https://github.com/react-cmpt/react-request-hook/commit/645d2c296421f823d98cf5a3ea302ad20d383dfd))


# [2.2.0](https://github.com/react-cmpt/react-request-hook/compare/v2.1.1...v2.2.0) (2020-12-24)


### Bug Fixes

* **useResource:** canceller closure ([f0d63ef](https://github.com/react-cmpt/react-request-hook/commit/f0d63ef332b1e5f7c215f0c01e9bb7f7a6d0a704))
* block state update on uninstall ([a7242b9](https://github.com/react-cmpt/react-request-hook/commit/a7242b9f309ea55653eb744b71d51e17716ae524))


### Features

* return original error ([eedcc72](https://github.com/react-cmpt/react-request-hook/commit/eedcc72971cd9bbf04f9550a2db58e2b110fb573))
* **useResource:** add res type and useDeepMemo ([d56da08](https://github.com/react-cmpt/react-request-hook/commit/d56da086622b0036142e3034758bf97a6bb13c06))
* **utils:** useDeepMemo ([c7af8cd](https://github.com/react-cmpt/react-request-hook/commit/c7af8cd23ae8e9c0d52a5b18d2146c529b885ef1))
* **utils:** useMountedState hook ([0596a63](https://github.com/react-cmpt/react-request-hook/commit/0596a63edd5316085807ea643b61ced566319ff1))
* **deps:** upgrade axios -> ^0.19 ([cdc899f](https://github.com/react-cmpt/react-request-hook/commit/cdc899f8db8cc4ef107fa471c15605dc17e78c85))



