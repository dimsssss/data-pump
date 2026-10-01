import type { Driver } from "./Driver";
import { mysqlDriver } from "./mysql-driver";

export type { ConnectParams, Driver, DriverSession } from "./Driver";
export { mysqlDriver } from "./mysql-driver";

// 접속을 지원하는 드라이버 목록 (key는 DriverInstaller의 드라이버 이름과 같다)
export const DRIVERS: Record<string, Driver> = {
  mysql: mysqlDriver,
};
