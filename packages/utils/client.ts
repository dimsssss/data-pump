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
  // 접속한 데이터베이스 이름 (url로 접속했으면 비어 있을 수 있다)
  database: string;
  // 화면 표시용 접속 주소 (예: postgres@localhost:5432/mydb)
  address: string;
  // 접속에 성공한 시각 (ISO 8601)
  connectedAt: string;
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

// Overview 화면에 표시할 접속한 DB의 개요
export interface TableSummary {
  name: string;
  rows: number;
  // 정확한 행 수를 제한 시간 안에 세지 못해 DB 통계의 추정값을 썼으면 true
  rowsEstimated: boolean;
  // 데이터 + 인덱스 크기 (byte)
  bytes: number;
}

export interface DatabaseOverview {
  // 현재 데이터베이스. 지정하지 않고 접속했으면 null이고 나머지 값은 비어 있다
  database: string | null;
  tables: TableSummary[];
  indexes: number;
  views: number;
  triggers: number;
  sizeBytes: number;
  encoding: string;
  // 접근할 수 있는 사용자 데이터베이스 목록 (시스템 DB 제외)
  databases: string[];
}

// QUERY 탭에서 실행한 SQL의 결과.
// IPC로 보낼 수 있고 화면에 바로 그릴 수 있게 값은 문자열·숫자·null로 바꿔 둔다
export type QueryValue = string | number | null;

export type QueryResult =
  // SELECT·SHOW처럼 행을 돌려주는 문
  | {
      kind: "rows";
      // 같은 이름의 열(예: JOIN한 두 테이블의 id)도 그대로 둔다
      columns: string[];
      rows: QueryValue[][];
      // 결과가 너무 많아 앞부분만 담았으면 true
      truncated: boolean;
      durationMs: number;
    }
  // INSERT·UPDATE·DDL처럼 행 없이 영향받은 행 수만 돌려주는 문
  | {
      kind: "affected";
      affectedRows: number;
      durationMs: number;
    };
