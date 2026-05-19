import {
  app,
  Menu,
  Tray,
  nativeImage,
  type MenuItemConstructorOptions
} from "electron";
import { join } from "node:path";
import { APP_DISPLAY_NAME } from "../shared/appIdentity";

const TRAY_ICON_PATH = join(__dirname, "assets/tray-icon-template.png");
const TRAY_ICON_SIZE = 18;

function createTrayIcon(): Electron.NativeImage {
  const image = nativeImage.createFromPath(TRAY_ICON_PATH);
  const resizedImage = image.resize({
    width: TRAY_ICON_SIZE,
    height: TRAY_ICON_SIZE
  });

  if (process.platform === "darwin") {
    resizedImage.setTemplateImage(true);
  }

  return resizedImage;
}

export type TrayActions = {
  onOpenSettings: () => void;
  onShowTinyPals: () => void;
};

function createCommandMenuItems(
  actions: TrayActions
): MenuItemConstructorOptions[] {
  return [
    {
      label: "Open Settings",
      accelerator: "CommandOrControl+,",
      click: actions.onOpenSettings
    },
    { label: "Show TinyPals", click: actions.onShowTinyPals },
    { type: "separator" },
    { label: "Quit", accelerator: "CommandOrControl+Q", click: () => app.quit() }
  ];
}

export function installApplicationMenu(actions: TrayActions): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: APP_DISPLAY_NAME,
      submenu: createCommandMenuItems(actions)
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

export function createTray(actions: TrayActions): Tray | undefined {
  try {
    const icon = createTrayIcon();

    if (icon.isEmpty()) {
      return undefined;
    }

    const tray = new Tray(icon);
    tray.setToolTip(APP_DISPLAY_NAME);
    tray.setContextMenu(
      Menu.buildFromTemplate(createCommandMenuItems(actions))
    );

    return tray;
  } catch {
    return undefined;
  }
}
