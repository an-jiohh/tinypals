import { copyFileSync, existsSync, readFileSync, utimesSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import electronPath from "electron";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
const appName = packageJson.build?.productName ?? packageJson.productName ?? packageJson.name;
const appId = packageJson.build?.appId ?? "com.pingu.desktoppet";

if (process.platform !== "darwin") {
  process.exit(0);
}

const contentsDir = dirname(dirname(electronPath));
const appBundleDir = dirname(contentsDir);
const infoPlistPath = join(contentsDir, "Info.plist");
const iconSourcePath = new URL("../build/icon.icns", import.meta.url);
const iconTargetFileName = "pingu-dev.icns";
const iconTargetPath = join(contentsDir, "Resources", iconTargetFileName);

if (!existsSync(infoPlistPath)) {
  process.exit(0);
}

function setPlistValue(key, value) {
  execFileSync("plutil", [
    "-replace",
    key,
    "-string",
    value,
    infoPlistPath
  ]);
}

setPlistValue("CFBundleName", appName);
setPlistValue("CFBundleDisplayName", appName);
setPlistValue("CFBundleIdentifier", `${appId}.dev`);

if (existsSync(iconSourcePath)) {
  copyFileSync(iconSourcePath, iconTargetPath);
  setPlistValue("CFBundleIconFile", iconTargetFileName);
}

const now = new Date();
utimesSync(infoPlistPath, now, now);
utimesSync(appBundleDir, now, now);
