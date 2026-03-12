import { stat } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { paths } from "./paths.ts";

loadEnvFile(paths["@/.env"]);

const BASE_DIR =
  process.platform === "win32"
    ? (process.env.APPDATA ?? "")
    : join(process.env.HOME ?? "", ".local/share");

const ANKI_USER = process.env.ANKI_USER ?? "User 1";

const ANKI_COLLECTION_MEDIA_PATH =
  process.env.ANKI_COLLECTION_MEDIA_PATH ||
  join(BASE_DIR, `Anki2/${ANKI_USER}/collection.media`);

try {
  await stat(ANKI_COLLECTION_MEDIA_PATH);
} catch {
  throw new Error(
    `ANKI_COLLECTION_MEDIA_PATH does not exist at: ${ANKI_COLLECTION_MEDIA_PATH}\n` +
      "Please check your .env file or ensure the path is correct.",
  );
}

export const env = {
  ANKI_COLLECTION_MEDIA_PATH,
};
