import { describe, expect, it } from "vitest";
import type { UpdateStatus } from "../../shared/types";
import { getUpdateAction, getUpdateStatusCopy } from "./updateStatusView";

const baseStatus = {
  currentVersion: "0.1.0"
} satisfies Pick<UpdateStatus, "currentVersion">;

describe("updateStatusView", () => {
  it("shows development builds as non-updatable", () => {
    const status: UpdateStatus = {
      ...baseStatus,
      state: "disabled-development"
    };

    expect(getUpdateStatusCopy(status).detail).toContain("packaged app");
    expect(getUpdateAction(status)).toEqual({
      action: "check",
      disabled: true,
      label: "Check"
    });
  });

  it("uses download as the primary action when an update is available", () => {
    const status: UpdateStatus = {
      ...baseStatus,
      latestVersion: "0.2.0",
      state: "available"
    };

    expect(getUpdateStatusCopy(status).title).toBe("Version 0.2.0 is available");
    expect(getUpdateAction(status)).toEqual({
      action: "download",
      disabled: false,
      label: "Download"
    });
  });

  it("uses restart as the primary action when an update is downloaded", () => {
    const status: UpdateStatus = {
      ...baseStatus,
      latestVersion: "0.2.0",
      state: "downloaded"
    };

    expect(getUpdateAction(status)).toEqual({
      action: "install",
      disabled: false,
      label: "Restart"
    });
  });

  it("disables the action while checking or downloading", () => {
    expect(
      getUpdateAction({
        ...baseStatus,
        state: "checking"
      })
    ).toMatchObject({ disabled: true, label: "Checking" });
    expect(
      getUpdateAction({
        ...baseStatus,
        percent: 12,
        state: "downloading"
      })
    ).toMatchObject({ disabled: true, label: "Downloading" });
  });
});
