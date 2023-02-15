import type { CacheKey } from "./cache";

type TimerId = ReturnType<typeof setTimeout>;

// 30min
const DEFAULT_CACHE_TTL = 1000 * 60 * 30;

export const _ttlcache = {
  data: new Map<CacheKey, any>(),
  timers: new Map<CacheKey, TimerId>(),
  get: <T = any>(k: CacheKey) => _ttlcache.data.get(k) as T,
  has: (k: CacheKey) => _ttlcache.data.has(k),
  set: <T = any>(k: CacheKey, v: T) => {
    if (_ttlcache.timers.has(k)) {
      clearTimeout(_ttlcache.timers.get(k) as TimerId);
    }
    _ttlcache.timers.set(
      k,
      setTimeout(() => _ttlcache.delete(k), DEFAULT_CACHE_TTL),
    );
    _ttlcache.data.set(k, v);
  },
  delete: (k: CacheKey) => {
    if (_ttlcache.timers.has(k)) {
      clearTimeout(_ttlcache.timers.get(k) as TimerId);
    }
    _ttlcache.timers.delete(k);
    return _ttlcache.data.delete(k);
  },
  clear: () => {
    _ttlcache.data.clear();

    const _iter = _ttlcache.timers.values();
    let _timer = _iter.next().value as TimerId;
    while (_timer) {
      clearTimeout(_timer);
      _timer = _iter.next().value as TimerId;
    }

    _ttlcache.timers.clear();
  },
};
