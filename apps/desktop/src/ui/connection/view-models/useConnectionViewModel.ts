import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ActiveConnection,
  ConnectionForm,
  ConnectStage,
  SavedConnection,
} from "@packages/utils/client";
import { electronConnectionClient } from "../../../data/clients/connection-client";
import { electronDriverClient } from "../../../data/clients/driver-client";

export type ConnectStatus =
  | { kind: "idle" }
  | { kind: "working"; message: string }
  | { kind: "success"; message: string; detail: string }
  | { kind: "error"; message: string };

const INITIAL_FORM: ConnectionForm = {
  name: "",
  comment: "",
  driver: "mysql",
  host: "",
  port: "",
  user: "",
  password: "",
  database: "",
  url: "",
};

const STAGE_MESSAGES: Record<ConnectStage, string> = {
  driver: "드라이버 확인 중…",
  login: "로그인 중…",
  save: "접속 정보 저장 중…",
};

// 목록의 이름 아래 표시할 문구: Url이 있으면 Url, 없으면 user@host:port/db
export function describeConnection(c: SavedConnection) {
  if (c.url) return c.url;
  const user = c.user ? `${c.user}@` : "";
  const port = c.port ? `:${c.port}` : "";
  const db = c.database ? `/${c.database}` : "";
  return `${c.driver}://${user}${c.host}${port}${db}`;
}

// 이름을 비워 두고 접속했을 때 앱 화면에 표시할 이름
const describeForm = (f: ConnectionForm) =>
  `${f.user ? `${f.user}@` : ""}${f.host || f.url}${f.port ? `:${f.port}` : ""}`;

const toForm = (c: SavedConnection): ConnectionForm => ({
  id: c.id,
  name: c.name,
  comment: c.comment,
  driver: c.driver,
  host: c.host,
  port: c.port,
  user: c.user,
  // 저장된 비밀번호는 renderer로 오지 않는다. 비워 두면 main이 저장된 값을 사용
  password: "",
  database: c.database,
  url: c.url,
});

// ipcRenderer.invoke가 붙이는 "Error invoking remote method '...': Error: " 접두어 제거
const toMessage = (err: unknown) =>
  (err instanceof Error ? err.message : String(err)).replace(
    /^Error invoking remote method '[^']+': (?:\w*Error: )?/,
    "",
  );

export function useConnectionViewModel(
  connectionClient = electronConnectionClient,
  driverClient = electronDriverClient,
) {
  const [form, setForm] = useState<ConnectionForm>(INITIAL_FORM);
  const [status, setStatus] = useState<ConnectStatus>({ kind: "idle" });
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const connecting = useRef(false);
  // 마지막으로 접속에 성공했을 때의 폼 내용과 접속. 이후 폼을 고치면 다시 접속해야 한다
  const lastConnected = useRef<{
    snapshot: string;
    active: ActiveConnection;
  } | null>(null);

  const refresh = useCallback(async () => {
    try {
      setConnections(await connectionClient.list());
    } catch (err) {
      setStatus({
        kind: "error",
        message: `접속 목록을 불러오지 못했습니다: ${toMessage(err)}`,
      });
    }
  }, [connectionClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const select = useCallback(
    (id: string) => {
      const saved = connections.find((c) => c.id === id);
      if (!saved || connecting.current) return;
      setSelectedId(id);
      setForm(toForm(saved));
      setStatus({ kind: "idle" });
    },
    [connections],
  );

  // 새 접속 정보 입력 (선택 해제). 이후 Connect하면 새 항목으로 저장된다
  const createNew = useCallback(() => {
    if (connecting.current) return;
    setSelectedId(null);
    setForm(INITIAL_FORM);
    setStatus({ kind: "idle" });
  }, []);

  const setField = useCallback(
    <K extends keyof ConnectionForm>(key: K, value: ConnectionForm[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  // 접속 중에만 진행 상황을 화면에 반영
  useEffect(() => {
    const offStage = connectionClient.onProgress(({ stage }) => {
      if (connecting.current)
        setStatus({ kind: "working", message: STAGE_MESSAGES[stage] });
    });
    const offDownload = driverClient.onProgress(({ name, percent }) => {
      if (connecting.current && percent < 100) {
        setStatus({
          kind: "working",
          message: `${name} 드라이버 다운로드 중… ${percent}%`,
        });
      }
    });
    return () => {
      offStage();
      offDownload();
    };
  }, [connectionClient, driverClient]);

  const connect = useCallback(async () => {
    if (connecting.current) return null;
    connecting.current = true;
    setStatus({ kind: "working", message: STAGE_MESSAGES.driver });

    try {
      const result = await connectionClient.connect(form);
      // 이후 다시 접속하면 같은 항목을 갱신하도록 발급된 id를 보관
      const connectedForm = { ...form, id: result.id };
      const active: ActiveConnection = {
        id: result.id,
        name: form.name.trim() || describeForm(connectedForm),
        driver: form.driver,
        serverVersion: result.serverVersion,
      };
      lastConnected.current = {
        snapshot: JSON.stringify(connectedForm),
        active,
      };
      setForm(connectedForm);
      setSelectedId(result.id);
      await refresh();
      setStatus({
        kind: "success",
        message: `접속 성공 · ${form.driver} ${result.serverVersion}`,
        detail: result.passwordSaved
          ? `접속 정보 저장: ${result.savedTo}`
          : `접속 정보 저장: ${result.savedTo} (OS 보안 저장소를 쓸 수 없어 비밀번호는 저장하지 않음)`,
      });
      return active;
    } catch (err) {
      setStatus({ kind: "error", message: toMessage(err) });
      return null;
    } finally {
      connecting.current = false;
    }
  }, [connectionClient, form, refresh]);

  // Apply: 지금 폼 그대로 접속된 상태면 바로, 아니면 접속한 뒤 앱 화면으로 넘긴다
  const apply = useCallback(
    async (onApplied: (active: ActiveConnection) => void) => {
      const last = lastConnected.current;
      const active =
        last && last.snapshot === JSON.stringify(form)
          ? last.active
          : await connect();
      if (active) onApplied(active);
    },
    [connect, form],
  );

  const listItems = useMemo(
    () =>
      connections.map((c) => ({
        id: c.id,
        name: c.name,
        driver: c.driver,
        description: describeConnection(c),
      })),
    [connections],
  );

  // 선택한 항목에 저장된 비밀번호가 있고 새로 입력하지 않았으면 그것을 사용
  const usesSavedPassword =
    !form.password &&
    connections.some((c) => c.id === form.id && c.hasPassword);

  return {
    form,
    setField,
    listItems,
    selectedId,
    select,
    createNew,
    usesSavedPassword,
    status,
    isConnecting: status.kind === "working",
    connect,
    apply,
  };
}

export type ConnectionViewModel = ReturnType<typeof useConnectionViewModel>;
