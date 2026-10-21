import type { ConnectParams } from "@packages/utils";
import type { RequestDriver } from "../process-contract";

// driver process 메시지 계약(driver/process-contract.ts)을 함수로 감싼다.
// repository는 메시지 형식을 몰라도 된다
export type DriverService = ReturnType<typeof createDriverService>;

export function createDriverService(request: RequestDriver) {
  return {
    install: (name: string) => request({ type: "install", name }),

    ensure: (name: string) => request({ type: "ensure", name }),

    // 로그인에 성공하면 connectionId로 DB 세션을 만들어 둔다
    connect: (connectionId: string, driver: string, params: ConnectParams) =>
      request({ type: "connect", connectionId, driver, params }),

    // driver process가 재시작되면 세션이 사라진다
    hasSession: (connectionId: string) =>
      request({ type: "has", connectionId }),

    overview: (connectionId: string) =>
      request({ type: "overview", connectionId }),

    query: (connectionId: string, sql: string) =>
      request({ type: "query", connectionId, sql }),
  };
}
