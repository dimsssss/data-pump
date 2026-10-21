// preload: DriverApi를 window.driver로 노출한다
import { contextBridge, ipcRenderer } from "electron";
import type { DriverProgress } from "@packages/utils/client";
import {
  DRIVER_API_KEY,
  DRIVER_CHANNELS as CH,
  type DriverApi,
} from "./contract";

export function exposeDriverApi() {
  const api: DriverApi = {
    download: (name) => ipcRenderer.invoke(CH.install, name),
    onProgress: (cb) => {
      const listener = (_e: Electron.IpcRendererEvent, p: DriverProgress) =>
        cb(p);
      ipcRenderer.on(CH.progress, listener);
      return () => ipcRenderer.removeListener(CH.progress, listener);
    },
  };
  contextBridge.exposeInMainWorld(DRIVER_API_KEY, api);
}
