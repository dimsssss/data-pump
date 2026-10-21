import { useCallback, useEffect, useState } from "react";
import type { ActiveConnection } from "@packages/utils/client";
import { connectionApi } from "../../../connection/ipc.renderer";

export type AppState =
  // main에 현재 접속을 묻는 중
  { kind: "loading" } | { kind: "ready"; active: ActiveConnection | null };

// 화면 전환 상태. 현재 접속은 main이 기억하므로 새로고침해도 작업 화면이 복원된다
export function useAppViewModel(connectionClient = connectionApi) {
  const [state, setState] = useState<AppState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    connectionClient.getActive().then(
      (active) => !cancelled && setState({ kind: "ready", active }),
      // 확인하지 못하면 접속 화면부터 시작한다
      () => !cancelled && setState({ kind: "ready", active: null }),
    );
    return () => {
      cancelled = true;
    };
  }, [connectionClient]);

  const open = useCallback(
    (active: ActiveConnection) => setState({ kind: "ready", active }),
    [],
  );

  const leave = useCallback(async () => {
    await connectionClient.deactivate().catch(() => {});
    setState({ kind: "ready", active: null });
  }, [connectionClient]);

  return { state, open, leave };
}
