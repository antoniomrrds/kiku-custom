import { createReadStream, createWriteStream } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { createGzip } from "node:zlib";
import chalk from "chalk";
import { paths } from "./paths.ts";

export const AnkiConnect = {
  call: async (action: string, params: Record<string, unknown> = {}) => {
    const res = await fetch("http://127.0.0.1:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });

    const result = (await res.json()) as { result: unknown; error?: string };
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  },
};

export async function gzipFile(src: string, dest: string = `${src}.gz`, removeSrc = true) {
  return new Promise<void>((resolve, reject) => {
    const gzip = createGzip();
    const input = createReadStream(src);
    const output = createWriteStream(dest);

    input.pipe(gzip).pipe(output);

    output.on("finish", async () => {
      if (removeSrc) {
        await rm(src, { force: true });
      }
      resolve();
    });

    output.on("error", reject);
  });
}

export const log = {
  red(message: string) {
    console.log(chalk.red(message));
  },
  green(message: string) {
    console.log(chalk.green(message));
  },
  yellow(message: string) {
    console.log(chalk.yellow(message));
  },
  blue(message: string) {
    console.log(chalk.blue(message));
  },
  magenta(message: string) {
    console.log(chalk.magenta(message));
  },
  cyan(message: string) {
    console.log(chalk.cyan(message));
  },
  white(message: string) {
    console.log(chalk.white(message));
  },
  gray(message: string) {
    console.log(chalk.gray(message));
  },

  // background colors (optional)
  bgRed(message: string) {
    console.log(chalk.bgRed(message));
  },
  bgGreen(message: string) {
    console.log(chalk.bgGreen(message));
  },
  bgBlue(message: string) {
    console.log(chalk.bgBlue(message));
  },
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getVersion() {
  const pkgJsonPath = paths["@/package.json"];
  const pkg = JSON.parse(await readFile(pkgJsonPath, "utf8"));
  const version = pkg.version;
  if (typeof version !== "string") throw Error("version is not a string");
  return version;
}
