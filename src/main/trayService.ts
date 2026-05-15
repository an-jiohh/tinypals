import { app, Menu, Tray, nativeImage } from "electron";

const TRAY_ICON_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWUlEQVR4nGNgGAWjYBSMglEwCkbBjMD///8vBqLugWiAeD4Q3wHiAkD8A4hfgXgUETcA8RkgPgbE/0A8E4gfoeBuINsL5QfiO0C8CogfA+LAh4g4AJiwBBNQCADY/SKBuwnGVAAAAABJRU5ErkJggg==";

function createTrayIcon(): Electron.NativeImage {
  const image = nativeImage.createFromBuffer(
    Buffer.from(TRAY_ICON_PNG_BASE64, "base64")
  );

  if (process.platform === "darwin") {
    image.setTemplateImage(true);
  }

  return image;
}

export function createTray(onShow: () => void): Tray | undefined {
  try {
    const icon = createTrayIcon();

    if (icon.isEmpty()) {
      return undefined;
    }

    const tray = new Tray(icon);
    tray.setToolTip("Pingu Desktop Pet");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: "Show Pingu", click: onShow },
        { type: "separator" },
        { label: "Quit", click: () => app.quit() }
      ])
    );

    tray.on("click", onShow);
    return tray;
  } catch {
    return undefined;
  }
}
