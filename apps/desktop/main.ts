// main 진입점: 앱 생명주기·창 관리, 그리고 data layer를 조립해 IPC로 연결한다
import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { ConnectionStorageService, type ConnectionForm } from "@packages/utils";
import {
  activate,
  connect,
  deactivate,
  getActive,
  getOverview,
  listConnections,
  runQuery,
} from "./src/data/repositories/connection-repository";
import { createDriverProcess } from "./src/data/services/driver-process";
import { createSafeStorageSecrets } from "./src/data/services/secret-store";

if (started) {
  app.quit();
}

// 앱 데이터(접속 정보, 드라이버, Chromium 캐시 등) 폴더 이름을 package.json의 name("desktop") 대신
// "data-pump"로 고정한다. app ready 이전에 설정해야 모든 데이터가 이 위치를 쓴다.
// app 이름 자체는 바꾸지 않는다: safeStorage의 키체인 항목이 앱 이름 기준이라 바꾸면
// 이미 암호화해 둔 비밀번호를 복호화할 수 없게 된다.
// 개발 실행(electron-forge start)은 "data-pump-dev"를 써서, 개발 중 만든 접속 정보와 드라이버가
// 설치한 배포용 앱에 보이지 않게 한다.
app.setPath(
  "userData",
  path.join(
    app.getPath("appData"),
    app.isPackaged ? "data-pump" : "data-pump-dev",
  ),
);

let win: BrowserWindow | null = null;

// ---------------------------------------------------------------------------
// data layer 조립
// ---------------------------------------------------------------------------

const driverProcess = createDriverProcess({
  entry: path.join(__dirname, "main.driver.js"),
  driverDir: path.join(app.getPath("userData"), "drivers"),
  onProgress: (p) => win?.webContents.send("driver:progress", p),
});

// 접속 정보는 OS별 표준 앱 설정 위치에 저장한다 (app.getPath("userData"))
//   macOS:   ~/Library/Application Support/data-pump/connections.json (개발 실행은 data-pump-dev)
//   Windows: %APPDATA%\data-pump\connections.json
//   Linux:   $XDG_CONFIG_HOME/data-pump/connections.json (기본 ~/.config)
// safeStorage는 app ready 이후에만 쓸 수 있어 처음 사용할 때 만든다
let connectionStorage: ConnectionStorageService | null = null;
const getConnectionStorage = () =>
  (connectionStorage ??= new ConnectionStorageService(
    path.join(app.getPath("userData"), "connections.json"),
    createSafeStorageSecrets(),
  ));

// ---------------------------------------------------------------------------
// IPC: preload.ts가 노출한 API와 짝을 이룬다
// ---------------------------------------------------------------------------

ipcMain.handle("driver:install", (_e, name: string) =>
  driverProcess.request({ type: "install", name }),
);

ipcMain.handle("connection:list", () =>
  listConnections(getConnectionStorage()),
);

ipcMain.handle("connection:connect", (e, form: ConnectionForm) =>
  connect(form, {
    storage: getConnectionStorage(),
    requestDriver: driverProcess.request,
    onProgress: (p) => e.sender.send("connection:progress", p),
  }),
);

ipcMain.handle("connection:overview", (_e, connectionId: string) =>
  getOverview(connectionId, driverProcess.request),
);

ipcMain.handle("connection:query", (_e, connectionId: string, sql: string) =>
  runQuery(connectionId, sql, driverProcess.request),
);

ipcMain.handle("connection:activate", (_e, connectionId: string) =>
  activate(connectionId),
);

ipcMain.handle("connection:getActive", () => getActive(driverProcess.request));

ipcMain.handle("connection:deactivate", () => deactivate());

// ---------------------------------------------------------------------------
// 창, 앱 생명주기
// ---------------------------------------------------------------------------

// 배포 앱은 일반 데스크톱 앱처럼 새로고침이 없게 한다.
// Electron 기본 메뉴의 View에 있는 Reload·Force Reload·Toggle Developer Tools를 빼고
// 확대·축소와 전체 화면만 남긴다. 개발 실행에서는 기본 메뉴를 그대로 쓴다.
// Edit 메뉴는 macOS에서 복사·붙여넣기 단축키가 동작하는 데 필요하므로 유지한다
function setPackagedMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(process.platform === "darwin" ? [{ role: "appMenu" as const }] : []),
      { role: "fileMenu" },
      { role: "editMenu" },
      {
        label: "View",
        submenu: [
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      { role: "windowMenu" },
    ]),
  );
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // MAIN_WINDOW_... 상수는 forge.config.ts의 renderer name('main_window')에서 만들어져요
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  win.on("closed", () => {
    win = null;
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
  driverProcess.kill();
});

app.on("before-quit", () => {
  driverProcess.kill();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  if (app.isPackaged) setPackagedMenu();
  createWindow();
  driverProcess.start();
});
