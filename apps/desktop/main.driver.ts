import { ConnectionManager, DriverInstaller } from "@packages/utils";

// main ↔ driver utility process 메시지 규약
//   main → driver: { type: "init", config: { driverDir } }
//                  { type: "install" | "ensure", id, name }
//                  { type: "connect", id, connectionId, driver, params }
//                  { type: "disconnect", id, connectionId }
//   driver → main: { type: "progress", name, percent }
//                  { type: "result", id, ok: true, data } | { type: "result", id, ok: false, error }

let installer: DriverInstaller | null = null;
let connections: ConnectionManager | null = null;

const post = (message: unknown) => process.parentPort.postMessage(message);

const requireInit = () => {
  if (!installer || !connections)
    throw new Error("driver process가 초기화되지 않았습니다");
  return { installer, connections };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlers: Record<string, (msg: any) => Promise<unknown>> = {
  install: (msg) => requireInit().installer.install(msg.name),
  ensure: (msg) => requireInit().installer.ensure(msg.name),
  connect: (msg) =>
    requireInit().connections.connect(msg.connectionId, msg.driver, msg.params),
  disconnect: (msg) => requireInit().connections.disconnect(msg.connectionId),
};

process.parentPort.on("message", async (e) => {
  const msg = e.data ?? {};

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
    connections = new ConnectionManager((name) => driverInstaller.load(name));
    return;
  }

  const handler = handlers[msg.type];
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
