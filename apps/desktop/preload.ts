// preload 진입점: ui(renderer)가 data(main)에 접근하는 데 필요한 API만 노출한다.
// ipcRenderer 자체는 노출하지 않는다 (renderer가 임의 채널을 호출할 수 없도록)
// 노출한 API의 타입은 src/global.d.ts, 사용하는 쪽은 src/data/clients
import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("driver", {
  download: (name: string) => ipcRenderer.invoke("driver:install", name),
  onProgress: (cb: (p: unknown) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, p: unknown) => cb(p);
    ipcRenderer.on("driver:progress", listener);
    return () => ipcRenderer.removeListener("driver:progress", listener);
  },
});

contextBridge.exposeInMainWorld("connection", {
  list: () => ipcRenderer.invoke("connection:list"),
  connect: (form: unknown) => ipcRenderer.invoke("connection:connect", form),
  onProgress: (cb: (p: unknown) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, p: unknown) => cb(p);
    ipcRenderer.on("connection:progress", listener);
    return () => ipcRenderer.removeListener("connection:progress", listener);
  },
});
