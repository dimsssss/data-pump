import {
  ConnectionStorageService,
  defaultConnectionName,
  parseConnectionForm,
  toSavedConnection,
  type ActiveConnection,
  type ConnectionForm,
  type ConnectProgress,
  type ConnectResult,
  type DatabaseOverview,
  type SavedConnection,
} from "@packages/utils";
import type { RequestDriver } from "../services/driver-process";

// 접속 정보의 source of truth: 저장소(ConnectionStorageService)와 드라이버 프로세스를 조합한다

// 접속에 성공한 결과(화면 표시용)와 Apply로 고른 현재 접속.
// main 프로세스 메모리에만 두어 renderer를 새로고침해도 유지되고, 앱을 종료하면 사라진다
const connected = new Map<string, ActiveConnection>();
let activeId: string | null = null;

// 화면 표시용 접속 주소 (예: app@127.0.0.1:3306/testdb). 비밀번호는 넣지 않는다
function describeAddress(form: ConnectionForm) {
  const user = form.user.trim() ? `${form.user.trim()}@` : "";
  const host = form.host.trim() || form.url.trim();
  const port = form.port.trim() ? `:${form.port.trim()}` : "";
  const db = form.database.trim() ? `/${form.database.trim()}` : "";
  return `${user}${host}${port}${db}`;
}

// Connect 버튼 흐름: 입력 검증 → 드라이버 확인/다운로드 → 로그인 → 접속 정보 저장
export async function connect(
  form: ConnectionForm,
  deps: {
    storage: ConnectionStorageService;
    requestDriver: RequestDriver;
    onProgress: (p: ConnectProgress) => void;
  },
): Promise<ConnectResult> {
  const { storage, requestDriver, onProgress } = deps;
  // 저장된 접속을 불러와 비밀번호를 비워 두었으면 OS 보안 저장소의 비밀번호를 쓴다.
  // (복호화한 비밀번호는 main 밖 renderer로는 보내지 않는다)
  const storedPassword =
    form.id && !form.password ? await storage.getPassword(form.id) : undefined;
  const effective: ConnectionForm = {
    ...form,
    password: form.password || storedPassword || "",
  };

  const params = parseConnectionForm(effective);
  const id = form.id ?? storage.newId();

  onProgress({ stage: "driver" });
  await requestDriver({ type: "ensure", name: form.driver });

  onProgress({ stage: "login" });
  const { serverVersion } = await requestDriver<{ serverVersion: string }>({
    type: "connect",
    connectionId: id,
    driver: form.driver,
    params,
  });

  // 로그인에 성공한 접속 정보만 저장
  onProgress({ stage: "save" });
  const connectedAt = new Date();
  const { passwordSaved } = await storage.save(id, effective, { connectedAt });

  // Apply하면 이 정보로 작업 화면을 연다
  connected.set(id, {
    id,
    name: defaultConnectionName(effective),
    driver: effective.driver,
    serverVersion,
    database: effective.database.trim(),
    address: describeAddress(effective),
    connectedAt: connectedAt.toISOString(),
  });

  return { id, serverVersion, savedTo: storage.file, passwordSaved };
}

// Apply: 접속에 성공한 connectionId를 현재 접속으로 정한다
export function activate(connectionId: string): ActiveConnection {
  const active = connected.get(connectionId);
  if (!active) throw new Error("접속 기록이 없습니다. 다시 접속하세요");
  activeId = connectionId;
  return active;
}

// 현재 접속. driver process가 재시작되어 DB 세션이 없어졌으면 현재 접속도 해제한다
export async function getActive(
  requestDriver: RequestDriver,
): Promise<ActiveConnection | null> {
  if (!activeId) return null;
  const alive = await requestDriver<boolean>({
    type: "has",
    connectionId: activeId,
  });
  if (!alive) {
    connected.delete(activeId);
    activeId = null;
    return null;
  }
  return connected.get(activeId) ?? null;
}

export function deactivate() {
  activeId = null;
}

export async function listConnections(
  storage: ConnectionStorageService,
): Promise<SavedConnection[]> {
  return (await storage.list()).map(toSavedConnection);
}

// 접속할 때 driver process에 만든 세션으로 DB 개요를 조회한다
export function getOverview(
  connectionId: string,
  requestDriver: RequestDriver,
): Promise<DatabaseOverview> {
  return requestDriver<DatabaseOverview>({ type: "overview", connectionId });
}
