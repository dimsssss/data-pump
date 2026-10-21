// main: connection IPC 채널을 repository에 연결한다 (contract.ts의 ConnectionApi와 짝)
import type { IpcMain } from "electron";
import type { ConnectionForm } from "@packages/utils";
import type { ConnectionRepository } from "./data/connection-repository";
import { CONNECTION_CHANNELS as CH } from "./contract";

export function registerConnectionIpc(
  ipcMain: IpcMain,
  connections: ConnectionRepository,
) {
  ipcMain.handle(CH.list, () => connections.list());

  ipcMain.handle(CH.connect, (e, form: ConnectionForm) =>
    connections.connect(form, (p) => e.sender.send(CH.progress, p)),
  );

  ipcMain.handle(CH.activate, (_e, connectionId: string) =>
    connections.activate(connectionId),
  );

  ipcMain.handle(CH.getActive, () => connections.getActive());

  ipcMain.handle(CH.deactivate, () => connections.deactivate());
}
