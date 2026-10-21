// main ↔ driver utility process(main.driver.ts) 사이의 메시지 계약.
// main(driver-process.ts, driver-service.ts)과 utility process(main.driver.ts)가 이 타입으로 맞춘다
import type {
  ConnectParams,
  DatabaseOverview,
  DriverInfo,
  DriverProgress,
  QueryResult,
} from "@packages/utils";

// main → driver: 프로세스를 띄운 직후 한 번 보낸다
export interface DriverInitMessage {
  type: "init";
  config: { driverDir: string; manifestUrl?: string };
}

// main → driver: 요청. type마다 응답 타입은 DriverResponses에 있다
export type DriverRequest =
  | { type: "install"; name: string }
  | { type: "ensure"; name: string }
  | {
      type: "connect";
      connectionId: string;
      driver: string;
      params: ConnectParams;
    }
  | { type: "overview"; connectionId: string }
  | { type: "query"; connectionId: string; sql: string }
  | { type: "has"; connectionId: string }
  | { type: "disconnect"; connectionId: string };

export type DriverRequestType = DriverRequest["type"];

export interface DriverResponses {
  install: DriverInfo;
  ensure: DriverInfo & { downloaded: boolean };
  // 로그인에 성공하면 connectionId로 DB 세션을 만들어 둔다
  connect: { serverVersion: string };
  overview: DatabaseOverview;
  query: QueryResult;
  // driver process가 재시작되면 세션이 사라진다
  has: boolean;
  disconnect: void;
}

// 요청마다 붙이는 id로 응답을 짝짓는다
export type DriverRequestMessage = DriverRequest & { id: number };

// driver → main
export type DriverEventMessage =
  | ({ type: "progress" } & DriverProgress)
  | { type: "result"; id: number; ok: true; data: unknown }
  | { type: "result"; id: number; ok: false; error: string };

export type RequestDriver = <R extends DriverRequest>(
  request: R,
) => Promise<DriverResponses[R["type"]]>;
