// renderer(브라우저 환경)에서 import해도 안전한 입구.
// Node 모듈(fs, crypto 등)을 import하는 코드를 절대 두지 않는다.
// 구현은 main/utility process 전용 입구인 "@packages/utils"(index.ts)에 있다.

export interface DriverInfo {
  name: string;
  version: string;
}

export interface DriverProgress {
  name: string;
  percent: number;
}

export interface DriverClient {
  download(name: string): Promise<DriverInfo>;
  onProgress(cb: (p: DriverProgress) => void): () => void;
}

// Connection 화면의 입력값. input 값 그대로 문자열로 주고받고, 변환·검증은 main에서 한다
export interface ConnectionForm {
  // 저장된 접속 정보의 id. 처음 접속하면 main이 발급해 결과로 돌려준다
  id?: string;
  name: string;
  comment: string;
  driver: string;
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  url: string;
}

export type ConnectStage = "driver" | "login" | "save";

export interface ConnectProgress {
  stage: ConnectStage;
}

export interface ConnectResult {
  id: string;
  serverVersion: string;
  // 접속 정보를 저장한 파일 경로 (OS별 표준 위치)
  savedTo: string;
  // OS 보안 저장소를 쓸 수 없는 환경이면 비밀번호는 저장하지 않는다
  passwordSaved: boolean;
}

// 접속에 성공해 앱 화면(SQL 편집기 등)으로 넘길 현재 접속
export interface ActiveConnection {
  id: string;
  name: string;
  driver: string;
  serverVersion: string;
}

// 목록 표시·폼 채우기용 저장된 접속 정보. 비밀번호는 renderer로 보내지 않고 저장 여부만 알려준다
export interface SavedConnection {
  id: string;
  name: string;
  comment: string;
  driver: string;
  host: string;
  port: string;
  user: string;
  database: string;
  url: string;
  hasPassword: boolean;
  lastConnectedAt?: string;
}

export interface ConnectionClient {
  list(): Promise<SavedConnection[]>;
  // form.id가 있고 password가 비어 있으면 저장된 비밀번호로 접속한다
  connect(form: ConnectionForm): Promise<ConnectResult>;
  onProgress(cb: (p: ConnectProgress) => void): () => void;
}
