import {
  ConnectionStorageService,
  parseConnectionForm,
  toSavedConnection,
  type ConnectionForm,
  type ConnectProgress,
  type ConnectResult,
  type SavedConnection,
} from "@packages/utils";
import type { RequestDriver } from "../services/driver-process";

// 접속 정보의 source of truth: 저장소(ConnectionStorageService)와 드라이버 프로세스를 조합한다

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
  const { passwordSaved } = await storage.save(id, effective, {
    connectedAt: new Date(),
  });

  return { id, serverVersion, savedTo: storage.file, passwordSaved };
}

export async function listConnections(
  storage: ConnectionStorageService,
): Promise<SavedConnection[]> {
  return (await storage.list()).map(toSavedConnection);
}
