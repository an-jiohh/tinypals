import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("settings window styles", () => {
  it("keeps rounded corners on the settings panel without a rectangular shell fill", () => {
    expect(styles).toMatch(
      /\.settings-shell\s*\{[\s\S]*?background:\s*transparent;[\s\S]*?\}/
    );
    expect(styles).toMatch(
      /\.settings-panel\s*\{[\s\S]*?border-radius:\s*14px;[\s\S]*?\}/
    );
    expect(styles).toMatch(
      /\.settings-panel\s*\{[\s\S]*?box-shadow:\s*inset 0 0 0 1px rgba\(55, 53, 47, 0\.14\);[\s\S]*?\}/
    );
  });
});
