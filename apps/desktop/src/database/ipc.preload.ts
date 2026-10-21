// preload: DatabaseApi를 window.database로 노출한다
import { contextBridge, ipcRenderer } from "electron";
import {
  DATABASE_API_KEY,
  DATABASE_CHANNELS as CH,
  type DatabaseApi,
} from "./contract";

export function exposeDatabaseApi() {
  const api: DatabaseApi = {
    overview: (connectionId) => ipcRenderer.invoke(CH.overview, connectionId),
    query: (connectionId, sql) =>
      ipcRenderer.invoke(CH.query, connectionId, sql),
  };
  contextBridge.exposeInMainWorld(DATABASE_API_KEY, api);
}
