import type { KikuConfig } from "#/util/config";
import type { Constants } from "#/util/general";
import type { Logger } from "../util/logger";
import type { MainThreadRequest, NexApi } from "./_kiku_worker.ts";

export type { NexApi } from "./_kiku_worker.ts";

// biome-ignore lint/complexity/noStaticOnlyClass: main-thread transport helpers are grouped as static methods
export class NexClient {
  static async fetchJson<T = unknown>(
    url: string,
    init?: RequestInit,
  ): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
      throw new Error(`Failed to fetch JSON from ${url}: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  static async fetchArrayBuffer(
    url: string,
    init?: RequestInit,
    options?: {
      range?: {
        start: number;
        end: number;
        size: number;
      };
    },
  ): Promise<ArrayBuffer> {
    const res = await fetch(url, init);

    const range = options?.range;
    if (range && NexClient.hasRangeHeader(init?.headers)) {
      if (res.status === 200) {
        return NexClient.sliceBytes(
          await res.arrayBuffer(),
          range.start,
          range.end,
        );
      }

      let buf = await res.arrayBuffer();
      if (buf.byteLength > range.size) {
        buf = buf.slice(0, range.size);
      }
      return buf;
    }

    return res.arrayBuffer();
  }

  static sliceBytes(buf: ArrayBuffer, start: number, end: number): ArrayBuffer {
    return buf.slice(start, end + 1);
  }

  private static hasRangeHeader(headers?: HeadersInit): boolean {
    if (!headers) return false;
    if (headers instanceof Headers) {
      return headers.has("Range");
    }
    if (Array.isArray(headers)) {
      return headers.some(([key]) => key.toLowerCase() === "range");
    }
    return Object.keys(headers).some((key) => key.toLowerCase() === "range");
  }
}

export type NexPromise = PromiseWithResolvers<NexApi> & {
  resolved: boolean;
};

export function createNexPromise(): NexPromise {
  const nex = Promise.withResolvers<NexApi>() as NexPromise;
  nex.resolved = false;

  const resolve = nex.resolve.bind(nex);
  nex.resolve = (value) => {
    nex.resolved = true;
    resolve(value);
  };

  return nex;
}

export function wrap<T>(worker: Worker, logger: Logger) {
  let msgId = 0;
  const pending = new Map();

  worker.onmessage = (e) => {
    const { id, result, error, log, requestId, fn, args } = e.data;
    if (log) {
      logger.push(log.level, log.args);
      return;
    }

    if (requestId) {
      void handleMainThreadRequest(worker, {
        requestId,
        fn,
        args,
      } as MainThreadRequest);
      return;
    }

    const { resolve, reject } = pending.get(id);
    pending.delete(id);
    error ? reject(error) : resolve(result);
  };

  return new Proxy(
    {},
    {
      get(_, fn) {
        if (fn === "then") return undefined;
        return (...args: unknown[]) =>
          new Promise((resolve, reject) => {
            const id = ++msgId;
            pending.set(id, { resolve, reject });
            worker.postMessage({ id, fn, args });
          });
      },
    },
  ) as T;
}

async function handleMainThreadRequest(
  worker: Worker,
  request: MainThreadRequest,
) {
  try {
    switch (request.fn) {
      case "fetchJson": {
        const result = await NexClient.fetchJson(...request.args);
        worker.postMessage({ requestId: request.requestId, result });
        return;
      }
      case "fetchArrayBuffer": {
        const result = await NexClient.fetchArrayBuffer(...request.args);
        worker.postMessage({ requestId: request.requestId, result });
        return;
      }
    }
  } catch (error) {
    worker.postMessage({ requestId: request.requestId, error });
  }
}

export async function createNex(
  opts: {
    env: Constants;
    assetsPath: string;
    config: KikuConfig;
    preferAnkiConnect: boolean;
    workerPath?: string;
  },
  logger: Logger,
  existingNex?: NexApi,
) {
  if (existingNex) {
    const nex = existingNex;
    await nex.init(opts);
    return nex;
  }

  let worker: Worker;
  if (opts.assetsPath !== window.location.origin && !import.meta.env.DEV) {
    worker = new Worker(`${opts.assetsPath}/_kiku_worker.js`, {
      type: "module",
    });
  } else if (opts.workerPath) {
    worker = new Worker(opts.workerPath, { type: "module" });
  } else {
    worker = new Worker(new URL("./_kiku_worker.ts", import.meta.url), {
      type: "module",
    });
  }

  const nex = wrap<NexApi>(worker, logger);
  await nex.init(opts);
  return nex;
}
