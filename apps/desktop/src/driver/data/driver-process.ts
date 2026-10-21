import { utilityProcess } from "electron";
import { UtilityProcess } from "electron/main";
import type { DriverProgress } from "@packages/utils/client";
import type {
  DriverEventMessage,
  DriverInitMessage,
  DriverRequestMessage,
  RequestDriver,
} from "../process-contract";

// 드라이버 설치·DB 접속을 맡는 별도 프로세스(main.driver.ts)와의 요청/응답.
// 메시지 계약은 driver/process-contract.ts

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

export function createDriverProcess(options: {
  // 빌드된 main.driver.js 경로
  entry: string;
  driverDir: string;
  onProgress: (p: DriverProgress) => void;
}) {
  let proc: UtilityProcess | null = null;
  const pendingRequests = new Map<number, Pending>();
  let nextRequestId = 1;

  const start = () => {
    if (proc) return proc;

    const child = utilityProcess.fork(options.entry, [], {
      serviceName: "driver",
    });
    proc = child;

    const init: DriverInitMessage = {
      type: "init",
      config: { driverDir: options.driverDir },
    };
    child.postMessage(init);

    child.on("message", (msg: DriverEventMessage) => {
      if (msg?.type === "progress") {
        options.onProgress({ name: msg.name, percent: msg.percent });
        return;
      }
      if (msg?.type === "result") {
        const pending = pendingRequests.get(msg.id);
        if (!pending) return;
        pendingRequests.delete(msg.id);
        if (msg.ok) pending.resolve(msg.data);
        else pending.reject(new Error(msg.error));
      }
    });

    child.on("exit", () => {
      proc = null;
      for (const { reject } of pendingRequests.values()) {
        reject(new Error("driver process가 종료되었습니다"));
      }
      pendingRequests.clear();
    });

    return child;
  };

  const request: RequestDriver = (req) =>
    new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      const message: DriverRequestMessage = { ...req, id };
      start().postMessage(message);
    });

  const kill = () => {
    proc?.kill();
  };

  return { start, request, kill };
}
