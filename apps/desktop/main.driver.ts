import { DriverInstaller, SessionManager } from "@packages/utils";
import type {
  DriverEventMessage,
  DriverInitMessage,
  DriverRequest,
  DriverRequestMessage,
  DriverRequestType,
  DriverResponses,
} from "./src/driver/process-contract";

// main ↔ driver utility process 메시지 계약은 src/driver/process-contract.ts

let installer: DriverInstaller | null = null;
let sessions: SessionManager | null = null;

const post = (message: DriverEventMessage) =>
  process.parentPort.postMessage(message);

const requireInit = () => {
  if (!installer || !sessions)
    throw new Error("driver process가 초기화되지 않았습니다");
  return { installer, sessions };
};

type Handlers = {
  [K in DriverRequestType]: (
    msg: Extract<DriverRequest, { type: K }>,
  ) => Promise<DriverResponses[K]>;
};

const handlers: Handlers = {
  install: (msg) => requireInit().installer.install(msg.name),
  ensure: (msg) => requireInit().installer.ensure(msg.name),
  connect: (msg) =>
    requireInit().sessions.connect(msg.connectionId, msg.driver, msg.params),
  overview: (msg) => requireInit().sessions.overview(msg.connectionId),
  query: (msg) => requireInit().sessions.query(msg.connectionId, msg.sql),
  has: async (msg) => requireInit().sessions.has(msg.connectionId),
  disconnect: (msg) => requireInit().sessions.disconnect(msg.connectionId),
};

// msg.type에 맞는 handler. 계약에 없는 type이면 undefined
// (Handlers의 key와 msg.type이 같으므로 handler와 msg의 타입이 서로 맞는다)
function findHandler(type: string) {
  if (!Object.prototype.hasOwnProperty.call(handlers, type)) return undefined;
  return handlers[type as DriverRequestType] as (
    msg: DriverRequest,
  ) => Promise<unknown>;
}

process.parentPort.on("message", async (e) => {
  const msg: DriverInitMessage | DriverRequestMessage = e.data ?? {};

  if (msg.type === "init") {
    if (!msg.config?.driverDir) {
      console.error(
        `[driver] init 메시지에 config.driverDir가 없습니다: ${JSON.stringify(msg)}`,
      );
      return;
    }
    const driverInstaller = new DriverInstaller({
      driverDir: msg.config.driverDir,
      manifestUrl: msg.config.manifestUrl,
      onProgress: (p) => post({ type: "progress", ...p }),
    });
    installer = driverInstaller;
    sessions = new SessionManager((name) => driverInstaller.load(name));
    return;
  }

  const handler = findHandler(msg.type);
  if (!handler) return;

  try {
    const data = await handler(msg);
    post({ type: "result", id: msg.id, ok: true, data });
  } catch (err) {
    // 접속 파라미터(비밀번호 포함)는 로그에 남기지 않는다
    console.error(
      `[driver] ${msg.type} 실패:`,
      err instanceof Error ? err.message : err,
    );
    post({
      type: "result",
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});
