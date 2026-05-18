import { describe, expect, it } from "vitest";
import { APP_DISPLAY_NAME } from "./appIdentity";
import packageJson from "../../package.json";

describe("app identity", () => {
  it("uses Pingu as the visible app name", () => {
    expect(APP_DISPLAY_NAME).toBe("Pingu");
  });

  it("keeps package metadata aligned with the visible app name", () => {
    expect(packageJson.build.productName).toBe(APP_DISPLAY_NAME);
    expect(packageJson.build.mac.icon).toBe("build/icon.icns");
    expect(packageJson.build.win.icon).toBe("build/icon.ico");
  });
});
