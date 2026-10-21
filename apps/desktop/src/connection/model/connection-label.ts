// 접속 정보를 사람이 읽는 문자열로 만든다. 비밀번호는 절대 넣지 않는다
import type { ConnectionForm, SavedConnection } from "@packages/utils/client";

type AddressParts = Pick<ConnectionForm, "user" | "host" | "port" | "database">;

// user@host:port/db (비어 있는 부분은 뺀다)
function joinAddress({ user, host, port, database }: AddressParts) {
  const u = user.trim() ? `${user.trim()}@` : "";
  const p = port.trim() ? `:${port.trim()}` : "";
  const db = database.trim() ? `/${database.trim()}` : "";
  return `${u}${host.trim()}${p}${db}`;
}

// 저장할 이름: Name이 비어 있으면 접속 정보로 만든다 (예: mysql: app@127.0.0.1:3306)
export function connectionName(form: ConnectionForm) {
  if (form.name.trim()) return form.name.trim();
  return `${form.driver}: ${joinAddress({
    ...form,
    host: form.host.trim() || form.url.trim(),
    database: "",
  })}`;
}

// 작업 화면에 표시할 접속 주소 (예: app@127.0.0.1:3306/testdb)
export function connectionAddress(form: ConnectionForm) {
  return joinAddress({ ...form, host: form.host.trim() || form.url.trim() });
}

// 접속 목록의 이름 아래 표시할 문구: Url이 있으면 Url, 없으면 driver://user@host:port/db
export function describeSavedConnection(c: SavedConnection) {
  if (c.url) return c.url;
  return `${c.driver}://${joinAddress(c)}`;
}
