import type {
  ActiveConnection,
  ConnectionForm,
  ConnectProgress,
  ConnectResult,
  SavedConnection,
} from "@packages/utils";
import {
  toSavedConnection,
  type ConnectionStorage,
} from "./connection-storage";
import {
  parseConnectionForm,
  toActiveConnection,
} from "../model/connection-form";
import { connectionName } from "../model/connection-label";
import type { DriverService } from "../../driver/data/driver-service";

// 접속 정보의 source of truth: 저장소(connection-storage)와 드라이버 프로세스를 조합한다
export type ConnectionRepository = ReturnType<
  typeof createConnectionRepository
>;

export function createConnectionRepository(deps: {
  // safeStorage는 app ready 이후에만 쓸 수 있어 처음 사용할 때 만든다
  getStorage: () => ConnectionStorage;
  driver: DriverService;
}) {
  const { getStorage, driver } = deps;

  // 접속에 성공한 결과(화면 표시용)와 Apply로 고른 현재 접속.
  // main 프로세스 메모리에만 두어 renderer를 새로고침해도 유지되고, 앱을 종료하면 사라진다
  const connected = new Map<string, ActiveConnection>();
  let activeId: string | null = null;

  // 저장된 접속을 불러와 비밀번호를 비워 두었으면 OS 보안 저장소의 비밀번호를 쓴다.
  // (복호화한 비밀번호는 main 밖 renderer로는 보내지 않는다)
  async function resolvePassword(form: ConnectionForm): Promise<string> {
    const savedId = form.id;
    const isSavedConnection = savedId !== undefined;
    const isPasswordLeftBlank = form.password === "";
    if (isSavedConnection && isPasswordLeftBlank) {
      return (await getStorage().getPassword(savedId)) ?? "";
    }
    return form.password;
  }

  // Connect 버튼 흐름: 입력 검증 → 드라이버 확인/다운로드 → 로그인 → 접속 정보 저장
  async function connect(
    form: ConnectionForm,
    onProgress: (p: ConnectProgress) => void,
  ): Promise<ConnectResult> {
    const storage = getStorage();
    const effective: ConnectionForm = {
      ...form,
      name: connectionName(form),
      password: await resolvePassword(form),
    };

    const params = parseConnectionForm(effective);
    const id = form.id ?? storage.newId();

    onProgress({ stage: "driver" });
    await driver.ensure(form.driver);

    onProgress({ stage: "login" });
    const { serverVersion } = await driver.connect(id, form.driver, params);

    // 로그인에 성공한 접속 정보만 저장
    onProgress({ stage: "save" });
    const connectedAt = new Date();
    const { passwordSaved } = await storage.save(id, effective, {
      connectedAt,
    });

    // Apply하면 이 정보로 작업 화면을 연다
    connected.set(
      id,
      toActiveConnection(id, effective, serverVersion, connectedAt),
    );

    return { id, serverVersion, savedTo: storage.file, passwordSaved };
  }

  // Apply: 접속에 성공한 connectionId를 현재 접속으로 정한다
  function activate(connectionId: string): ActiveConnection {
    const active = connected.get(connectionId);
    if (!active) throw new Error("접속 기록이 없습니다. 다시 접속하세요");
    activeId = connectionId;
    return active;
  }

  // 현재 접속. driver process가 재시작되어 DB 세션이 없어졌으면 현재 접속도 해제한다
  async function getActive(): Promise<ActiveConnection | null> {
    if (activeId === null) return null;
    const alive = await driver.hasSession(activeId);
    if (!alive) {
      connected.delete(activeId);
      activeId = null;
      return null;
    }
    return connected.get(activeId) ?? null;
  }

  function deactivate() {
    activeId = null;
  }

  async function list(): Promise<SavedConnection[]> {
    return (await getStorage().list()).map(toSavedConnection);
  }

  return { connect, activate, getActive, deactivate, list };
}
