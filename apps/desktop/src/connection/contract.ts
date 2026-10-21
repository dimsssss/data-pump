// renderer ↔ main 사이의 connection IPC 계약.
// main(ipc.main.ts), preload(ipc.preload.ts), renderer(ipc.renderer.ts)가 모두 이 파일을 기준으로 맞춘다.
// 접속한 DB의 데이터 조회(개요, 쿼리)는 database/contract.ts에 있다.
// 세 프로세스에서 import하므로 타입과 상수만 둔다
import type {
  ActiveConnection,
  ConnectionForm,
  ConnectProgress,
  ConnectResult,
  SavedConnection,
} from "@packages/utils/client";

// preload가 window에 노출하는 이름 (window.connection)
export const CONNECTION_API_KEY = "connection";

export const CONNECTION_CHANNELS = {
  list: "connection:list",
  connect: "connection:connect",
  // main → renderer 이벤트
  progress: "connection:progress",
  activate: "connection:activate",
  getActive: "connection:getActive",
  deactivate: "connection:deactivate",
} as const;

export interface ConnectionApi {
  list(): Promise<SavedConnection[]>;
  // form.id가 있고 password가 비어 있으면 저장된 비밀번호로 접속한다
  connect(form: ConnectionForm): Promise<ConnectResult>;
  onProgress(cb: (p: ConnectProgress) => void): () => void;
  // 접속에 성공한 connectionId를 현재 접속으로 정한다 (Apply). 작업 화면에 표시할 정보를 돌려준다
  activate(connectionId: string): Promise<ActiveConnection>;
  // 현재 접속. 없거나 DB 세션이 끊겼으면 null (새로고침 후 화면 복원용)
  getActive(): Promise<ActiveConnection | null>;
  // 현재 접속을 해제한다 (작업 화면에서 접속 화면으로 돌아갈 때)
  deactivate(): Promise<void>;
}
