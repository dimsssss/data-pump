// preload: ConnectionApi를 window.connection으로 노출한다.
// ipcRenderer 자체는 노출하지 않는다 (renderer가 임의 채널을 호출할 수 없도록)
import { contextBridge, ipcRenderer } from "electron";
import type { ConnectProgress } from "@packages/utils/client";
import {
  CONNECTION_API_KEY,
  CONNECTION_CHANNELS as CH,
  type ConnectionApi,
} from "./contract";

export function exposeConnectionApi() {
  const api: ConnectionApi = {
    list: () => ipcRenderer.invoke(CH.list),
    connect: (form) => ipcRenderer.invoke(CH.connect, form),
    onProgress: (cb) => {
      const listener = (_e: Electron.IpcRendererEvent, p: ConnectProgress) =>
        cb(p);
      ipcRenderer.on(CH.progress, listener);
      return () => ipcRenderer.removeListener(CH.progress, listener);
    },
    activate: (connectionId) => ipcRenderer.invoke(CH.activate, connectionId),
    getActive: () => ipcRenderer.invoke(CH.getActive),
    deactivate: () => ipcRenderer.invoke(CH.deactivate),
  };
  contextBridge.exposeInMainWorld(CONNECTION_API_KEY, api);
}
