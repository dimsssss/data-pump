# database

접속한 DB의 데이터(개요, 쿼리 결과)를 조회하고, 그것을 보여 주는 작업 화면(Workspace)을 다룹니다.
어느 DB인지는 `connection` 도메인이 Apply로 넘겨준 `ActiveConnection.id`(connectionId)로 정합니다.
조회는 utility process에 이미 열려 있는 세션으로 하므로, 이 도메인은 비밀번호나 접속 정보를 다루지 않습니다.

## 파일

| 파일                                      | 실행되는 곳 | 역할                                                               |
| ----------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `contract.ts`                             | 모두        | IPC 채널 이름(`DATABASE_CHANNELS`)과 `DatabaseApi`                 |
| `ipc.renderer.ts`                         | renderer    | preload가 노출한 `window.database` (ViewModel이 사용)              |
| `ipc.preload.ts`                          | preload     | `DatabaseApi`를 `window.database`로 노출                           |
| `ipc.main.ts`                             | main        | 채널을 `database-repository`에 연결                                |
| `data/database-repository.ts`             | main        | `driver` 도메인의 driver-service로 세션에 개요·쿼리를 요청         |
| `ui/views/Workspace.tsx`                  | renderer    | 작업 화면: 상단 탭(`WorkspaceNav`), 사이드바, 상태 바              |
| `ui/view-models/useWorkspaceViewModel.ts` | renderer    | 탭 상태, 개요 조회(사이드바 테이블 목록과 OVERVIEW 탭이 함께 사용) |
| `ui/overview/`                            | renderer    | OVERVIEW 탭: 통계 카드, 테이블별 행 수 차트, 추가 메타데이터       |
| `ui/query/`                               | renderer    | QUERY 탭: SQL 편집기, 실행, 결과 표                                |

## 흐름

- **개요**: 작업 화면이 열리거나 Refresh를 누르면 `overview(connectionId)` → repository → driver-service `{ type: "overview" }` → `SessionManager`가 세션의 드라이버로 메타데이터 SQL을 실행합니다. 연달아 요청하면 마지막 결과만 반영합니다.
- **쿼리**: QUERY 탭에서 실행하면 `query(connectionId, sql)` → 같은 경로로 SQL 한 문장을 실행합니다. 결과는 IPC로 보낼 수 있게 문자열·숫자·null로 바꾸고, 행이 많으면 앞부분만 담아 `truncated`로 알립니다. 세션 하나로 순서대로 실행되므로 실행 중에는 다시 실행하지 않습니다.
- **나가기**: 작업 화면의 나가기는 `app`이 `connection`의 `deactivate()`를 호출해 접속 화면으로 돌아갑니다.
