// driver utility process에서 접속 단위로 작업을 요청하는 상위 계층.
// 실제 DB 통신은 Driver가, 드라이버 모듈 준비는 DriverInstaller가 맡는다.
import {
  DRIVERS,
  type ConnectParams,
  type Driver,
  type DriverSession,
} from "./driver";

// 호출하는 쪽은 driver를 직접 보지 않고 connection을 통해서만 접속 파라미터 타입을 쓴다
export type { ConnectParams };

export class ConnectionManager {
  private sessions = new Map<string, DriverSession>();

  constructor(
    private loadDriver: (name: string) => Promise<unknown>,
    private drivers: Record<string, Driver> = DRIVERS,
  ) {}

  // connectionId마다 세션은 하나: 같은 접속 정보로 다시 접속하면 이전 세션을 닫는다
  async connect(connectionId: string, driver: string, params: ConnectParams) {
    const impl = this.drivers[driver];
    if (!impl) throw new Error(`접속을 지원하지 않는 드라이버: ${driver}`);

    const session = await impl.connect(await this.loadDriver(driver), params);
    await this.disconnect(connectionId);
    this.sessions.set(connectionId, session);
    return { serverVersion: session.serverVersion };
  }

  async disconnect(connectionId: string) {
    const session = this.sessions.get(connectionId);
    if (!session) return;
    this.sessions.delete(connectionId);
    await session.close().catch(() => {});
  }

  async disconnectAll() {
    await Promise.all(
      [...this.sessions.keys()].map((id) => this.disconnect(id)),
    );
  }

  has(connectionId: string) {
    return this.sessions.has(connectionId);
  }
}
