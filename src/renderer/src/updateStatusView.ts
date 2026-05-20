import type { UpdateStatus } from "../../shared/types";

export type UpdateAction = {
  action: "check" | "download" | "install";
  disabled: boolean;
  label: string;
};

export type UpdateStatusCopy = {
  detail: string;
  title: string;
};

export function getUpdateAction(status: UpdateStatus): UpdateAction {
  switch (status.state) {
    case "available":
      return {
        action: "download",
        disabled: false,
        label: "Download"
      };
    case "downloaded":
      return {
        action: "install",
        disabled: false,
        label: "Restart"
      };
    case "checking":
      return {
        action: "check",
        disabled: true,
        label: "Checking"
      };
    case "downloading":
      return {
        action: "download",
        disabled: true,
        label: "Downloading"
      };
    case "disabled-development":
      return {
        action: "check",
        disabled: true,
        label: "Check"
      };
    default:
      return {
        action: "check",
        disabled: false,
        label: "Check"
      };
  }
}

export function getUpdateStatusCopy(status: UpdateStatus): UpdateStatusCopy {
  switch (status.state) {
    case "disabled-development":
      return {
        detail: "Updates can be checked from the packaged app.",
        title: `Version ${status.currentVersion}`
      };
    case "checking":
      return {
        detail: "Looking for a newer release.",
        title: `Version ${status.currentVersion}`
      };
    case "not-available":
      return {
        detail: "TinyPals is up to date.",
        title: `Version ${status.currentVersion}`
      };
    case "available":
      return {
        detail: `Current version ${status.currentVersion}`,
        title: `Version ${status.latestVersion} is available`
      };
    case "downloading":
      return {
        detail:
          typeof status.percent === "number"
            ? `Downloading update (${Math.round(status.percent)}%)`
            : "Downloading update.",
        title: `Version ${status.latestVersion ?? status.currentVersion}`
      };
    case "downloaded":
      return {
        detail: "Restart TinyPals to finish installing.",
        title: `Version ${status.latestVersion} is ready`
      };
    case "error":
      return {
        detail: status.message,
        title: "Update failed"
      };
    case "idle":
    default:
      return {
        detail: "Check GitHub Releases for a newer version.",
        title: `Version ${status.currentVersion}`
      };
  }
}
