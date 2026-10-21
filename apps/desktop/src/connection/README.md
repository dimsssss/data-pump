# connection

사용자가 저장한 **접속 정보**(Connection)와 Apply로 고른 **현재 접속**(ActiveConnection)을 다룹니다.
DB와 실제로 열려 있는 연결(Session)은 utility process의 `@packages/utils` `SessionManager`가 맡고, 이 도메인은 `connectionId`로만 가리킵니다.
접속한 DB의 개요·쿼리 조회는 `database/` 도메인에 있습니다.

## 파일

| 파일                            | 실행되는 곳 | 역할                                                                                     |
| ------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `model/connection-form.ts`      | 모두        | 빈 폼, 저장된 접속 → 폼, 입력 검증(`parseConnectionForm`, `parsePort`), 현재 접속 만들기 |
| `model/connection-label.ts`     | 모두        | 저장 이름, 화면 표시용 주소, 목록 설명 문구                                              |
| `contract.ts`                   | 모두        | IPC 채널 이름(`CONNECTION_CHANNELS`)과 `ConnectionApi`                                   |
| `ipc.renderer.ts`               | renderer    | preload가 노출한 `window.connection` (ViewModel이 사용)                                  |
| `ipc.preload.ts`                | preload     | `ConnectionApi`를 `window.connection`으로 노출                                           |
| `ipc.main.ts`                   | main        | 채널을 `connection-repository`에 연결                                                    |
| `data/connection-repository.ts` | main        | Connect·Apply 흐름과 현재 접속 상태                                                      |
| `data/connection-storage.ts`    | main        | `connections.json` 읽기·쓰기, 비밀번호 암호화, renderer로 보낼 형태로 변환               |
| `data/secret-store.ts`          | main        | Electron safeStorage(OS 키체인)로 만든 `SecretStore`                                     |
| `ui/`                           | renderer    | 접속 설정 화면 (`views/`, `view-models/useConnectionViewModel.ts`)                       |

## 흐름

1. **목록**: 화면이 열리면 `list()` → storage가 파일을 읽고 `toSavedConnection`으로 비밀번호를 뺀 형태를 돌려줍니다.
2. **Connect**: `connect(form)` → repository가
   - 저장된 접속이고 비밀번호를 비워 두었으면 storage에서 복호화한 비밀번호를 씁니다 (main 밖으로 보내지 않음).
   - `parseConnectionForm`으로 검증하고 `connectionName`으로 이름을 정합니다.
   - `driver` 도메인에 드라이버 확인(`ensure`)과 로그인(`connect`)을 요청합니다. 이때 utility process에 세션이 만들어집니다.
   - 로그인에 성공한 경우에만 storage에 저장합니다.
   - 단계마다 `connection:progress` 이벤트를 보냅니다 (`driver` → `login` → `save`).
3. **Apply**: `activate(connectionId)` → 현재 접속으로 정하고 작업 화면(`database/ui`)에 넘길 `ActiveConnection`을 돌려줍니다.
4. **새로고침 복원**: `getActive()` → 세션이 살아 있으면 현재 접속을, driver process가 재시작되어 세션이 없어졌으면 `null`을 돌려줍니다.
5. **나가기**: `deactivate()` → 현재 접속을 해제합니다 (세션은 닫지 않음).

## 상태의 주인

| 상태                  | 주인                                      | 다른 곳에서는                                                          |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| 저장된 접속 정보      | `connections.json` (`connection-storage`) | renderer는 비밀번호를 뺀 `SavedConnection`만 받음                      |
| 열린 DB 세션          | utility process `SessionManager`          | repository가 `hasSession`으로 확인만 함                                |
| 현재 접속(`activeId`) | main `connection-repository` (메모리)     | renderer(`app/useAppViewModel`)는 `getActive()` 결과를 화면용으로 복사 |
| 폼 입력값             | renderer `useConnectionViewModel`         | —                                                                      |
