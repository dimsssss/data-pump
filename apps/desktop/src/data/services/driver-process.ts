import { utilityProcess } from "electron";
import { UtilityProcess } from "electron/main";
import type { DriverProgress } from "@packages/utils/client";

// 드라이버 설치·DB 접속을 맡는 별도 프로세스(main.driver.ts)와의 요청/응답.
// 메시지 규약은 main.driver.ts 상단 주석 참고
export type RequestDriver = <T>(message: Record<string, unknown>) => Promise<T>;

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

    child.postMessage({
      type: "init",
      config: { driverDir: options.driverDir },
    });

    child.on("message", (msg) => {
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

  const request: RequestDriver = <T>(message: Record<string, unknown>) =>
    new Promise<T>((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      start().postMessage({ ...message, id });
    });

  const kill = () => {
    proc?.kill();
  };

  return { start, request, kill };
}
