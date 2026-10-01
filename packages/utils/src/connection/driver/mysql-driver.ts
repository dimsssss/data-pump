import { CONNECT_TIMEOUT_MS, type Driver } from "./Driver";

// mysql2 번들 중 여기서 쓰는 부분만의 타입
interface Mysql2Module {
  createConnection(options: Record<string, unknown>): {
    promise(): {
      query(sql: string): Promise<[Array<Record<string, unknown>>, unknown]>;
      end(): Promise<void>;
      destroy(): void;
    };
  };
}

export const mysqlDriver: Driver = {
  async connect(driverModule, params) {
    const mysql = driverModule as Mysql2Module;
    // Host가 비어 있고 Url만 입력했으면 URL로 접속 (비밀번호는 입력란 값을 우선)
    const options =
      !params.host && params.url
        ? { uri: params.url, password: params.password || undefined }
        : {
            host: params.host,
            port: params.port,
            user: params.user,
            password: params.password,
            database: params.database || undefined,
          };

    const conn = mysql
      .createConnection({ ...options, connectTimeout: CONNECT_TIMEOUT_MS })
      .promise();
    try {
      // 실제 로그인은 첫 쿼리 시점에 이루어지므로 버전 조회로 인증까지 확인
      const [rows] = await conn.query("SELECT VERSION() AS version");
      return {
        serverVersion: String(rows[0]?.version ?? ""),
        close: () => conn.end(),
      };
    } catch (err) {
      conn.destroy();
      throw err;
    }
  },
};
