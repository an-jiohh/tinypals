import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";

describe("package build config", () => {
  it("builds a macOS zip alongside the dmg for auto updates", () => {
    expect(packageJson.build.mac.target).toContain("dmg");
    expect(packageJson.build.mac.target).toContain("zip");
  });

  it("keeps GitHub publishing scoped to release scripts", () => {
    expect(packageJson.scripts["dist:mac"]).toContain("--publish never");
    expect(packageJson.scripts["dist:win"]).toContain("--publish never");
    expect(packageJson.scripts["release:mac"]).toContain("--publish always");
    expect(packageJson.scripts["release:win"]).toContain("--publish always");
    expect(packageJson.scripts["release:mac"]).toContain(
      "-c.publish.provider=github"
    );
    expect(packageJson.scripts["release:win"]).toContain(
      "-c.publish.provider=github"
    );
  });
});
