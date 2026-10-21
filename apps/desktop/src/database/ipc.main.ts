// main: database IPC 채널을 repository에 연결한다 (contract.ts의 DatabaseApi와 짝)
import type { IpcMain } from "electron";
import type { DatabaseRepository } from "./data/database-repository";
import { DATABASE_CHANNELS as CH } from "./contract";

export function registerDatabaseIpc(
  ipcMain: IpcMain,
  database: DatabaseRepository,
) {
  ipcMain.handle(CH.overview, (_e, connectionId: string) =>
    database.getOverview(connectionId),
  );

  ipcMain.handle(CH.query, (_e, connectionId: string, sql: string) =>
    database.runQuery(connectionId, sql),
  );
}
