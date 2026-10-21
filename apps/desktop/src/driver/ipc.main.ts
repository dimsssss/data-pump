// main: driver IPC 채널을 driver service에 연결한다 (contract.ts의 DriverApi와 짝)
import type { IpcMain, WebContents } from "electron";
import type { DriverProgress } from "@packages/utils";
import type { DriverService } from "./data/driver-service";
import { DRIVER_CHANNELS as CH } from "./contract";

export function registerDriverIpc(ipcMain: IpcMain, driver: DriverService) {
  ipcMain.handle(CH.install, (_e, name: string) => driver.install(name));
}

// 드라이버 다운로드 진행률을 화면에 보낸다
export function sendDriverProgress(
  webContents: WebContents | undefined,
  p: DriverProgress,
) {
  webContents?.send(CH.progress, p);
}
