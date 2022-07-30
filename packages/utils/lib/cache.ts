interface Options {
  cacheDuringDev:
    | false
    | {
        thresholdDuration: number;
      };
}

/**
 * This caching approach allows users to cache those requests during dev if they fall under a certain threshold
 * offset, whose subsequent requests can't be cached for long.
 */

export function cache(
  cb: Function,
  options: Options = {
    cacheDuringDev: { thresholdDuration: 120 * 10000000 },
  }
) {
  const userStore: Map<any, any> = new Map(); // to store during cross cache states.
  const cache: Map<any, any> = new Map();
  const ssrTimestamp: Map<string, number> = new Map();
  return async (
    arg: Record<string, any> & { __serve__: boolean; __url__: string } // the framework only passes one argument, params
  ) => {
    if (arg.__serve__ && options.cacheDuringDev) {
      if (!ssrTimestamp.has(arg.__url__)) {
        const result = await cb(arg, userStore);
        cache.set(arg.__url__, result);
        ssrTimestamp.set(arg.__url__, new Date().getTime());
        return result;
      } else {
        const prevTimestamp = ssrTimestamp.get(arg.__url__);
        const currTimestamp = new Date().getTime();
        if (
          currTimestamp - prevTimestamp >
          options.cacheDuringDev.thresholdDuration
        ) {
          return cache.get(arg.__url__);
        }
      }
    }
    return await cb(arg, userStore);
  };
}
