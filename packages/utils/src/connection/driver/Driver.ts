// DB와 직접 대화하는 계층.
// 드라이버 모듈은 DriverInstaller.load로 받은 번들이며, 드라이버마다 사용법이 달라 Driver로 감싼다.
import type { DatabaseOverview } from "../../../client";

export type { DatabaseOverview };

export interface ConnectParams {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  url?: string;
}

export interface DriverSession {
  serverVersion: string;
  // 메타데이터 SQL은 DB마다 달라 드라이버가 구현한다
  overview(): Promise<DatabaseOverview>;
  close(): Promise<void>;
}

export interface Driver {
  connect(driverModule: unknown, params: ConnectParams): Promise<DriverSession>;
}

export const CONNECT_TIMEOUT_MS = 10_000;
