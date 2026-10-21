// Connection 화면의 입력값(ConnectionForm)과 다른 모델 사이의 변환.
// 순수 함수만 둔다: renderer와 main이 같은 코드를 쓴다
import type { ConnectParams } from "@packages/utils";
import type {
  ActiveConnection,
  ConnectionForm,
  SavedConnection,
} from "@packages/utils/client";
import { connectionAddress, connectionName } from "./connection-label";

export const EMPTY_FORM: ConnectionForm = {
  name: "",
  comment: "",
  driver: "mysql",
  host: "",
  port: "",
  user: "",
  password: "",
  database: "",
  url: "",
};

// 저장된 접속을 폼에 채운다
export function toForm(c: SavedConnection): ConnectionForm {
  return {
    id: c.id,
    name: c.name,
    comment: c.comment,
    driver: c.driver,
    host: c.host,
    port: c.port,
    user: c.user,
    // 저장된 비밀번호는 renderer로 오지 않는다. 비워 두면 main이 저장된 값을 사용
    password: "",
    database: c.database,
    url: c.url,
  };
}

// Port 입력값을 숫자로. 비어 있으면 드라이버 기본값을 쓰도록 undefined
export function parsePort(port: string): number | undefined {
  if (!port.trim()) return undefined;
  const n = Number(port);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Port가 올바르지 않습니다: ${port}`);
  }
  return n;
}

// 입력값 검증: renderer 값은 신뢰하지 않고 main에서 다시 확인한다
export function parseConnectionForm(form: ConnectionForm): ConnectParams {
  if (!form.driver) throw new Error("드라이버를 선택하세요");

  const host = form.host.trim();
  const url = form.url.trim();
  if (!host && !url) throw new Error("Host 또는 Url을 입력하세요");

  return {
    host: host || undefined,
    port: parsePort(form.port),
    user: form.user.trim() || undefined,
    password: form.password || undefined,
    database: form.database.trim() || undefined,
    url: url || undefined,
  };
}

// 접속에 성공한 폼을 작업 화면에 넘길 현재 접속으로 만든다
export function toActiveConnection(
  id: string,
  form: ConnectionForm,
  serverVersion: string,
  connectedAt: Date,
): ActiveConnection {
  return {
    id,
    name: connectionName(form),
    driver: form.driver,
    serverVersion,
    database: form.database.trim(),
    address: connectionAddress(form),
    connectedAt: connectedAt.toISOString(),
  };
}
