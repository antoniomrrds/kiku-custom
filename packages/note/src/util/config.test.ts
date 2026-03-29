import { describe, expect, it } from "vitest";
import { rootDatasetConfigWhitelist } from "./config";
import { defaultConfig } from "./default-config";

describe("rootDatasetConfigWhitelist", () => {
  it("should only contain keys present in defaultConfig", () => {
    const defaultConfigKeys = Object.keys(defaultConfig);

    for (const key of rootDatasetConfigWhitelist) {
      expect(defaultConfigKeys).toContain(key);
    }
  });
});
