// DB와 직접 대화하는 계층.
// 드라이버 모듈은 DriverInstaller.load로 받은 번들이며, 드라이버마다 사용법이 달라 Driver로 감싼다.

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
  close(): Promise<void>;
}

export interface Driver {
  connect(driverModule: unknown, params: ConnectParams): Promise<DriverSession>;
}

export const CONNECT_TIMEOUT_MS = 10_000;
