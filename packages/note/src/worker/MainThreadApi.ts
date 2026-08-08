import type { Logger } from "#/src/lib/logger.ts";

export class MainThreadApi {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async fetchJson(url: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(url, init);
    if (!res.ok) {
      throw new Error(`Failed to fetch JSON from ${url}: ${res.status}`);
    }
    return res.json() as Promise<unknown>;
  }

  async fetchArrayBuffer(
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
    if (range && hasRangeHeader(init?.headers)) {
      if (res.status === 200) {
        return sliceBytes(await res.arrayBuffer(), range.start, range.end);
      }

      let buf = await res.arrayBuffer();
      if (buf.byteLength > range.size) {
        buf = buf.slice(0, range.size);
      }
      return buf;
    }

    return res.arrayBuffer();
  }

  async log(level: string, args: unknown[]): Promise<void> {
    this.logger.push(level as Parameters<Logger["push"]>[0], args);
  }
}

function sliceBytes(buf: ArrayBuffer, start: number, end: number): ArrayBuffer {
  return buf.slice(start, end + 1);
}

function hasRangeHeader(headers?: HeadersInit): boolean {
  if (!headers) return false;
  if (headers instanceof Headers) {
    return headers.has("Range");
  }
  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === "range");
  }
  return Object.keys(headers).some((key) => key.toLowerCase() === "range");
}
