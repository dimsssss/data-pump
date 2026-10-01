import { describe, expect, it, vi } from "vitest";
import { ConnectionManager } from "../../src/connection/ConnectionManager";
import type { Driver } from "../../src/connection/driver";

// 실제 DB 없이 세션 생성/종료만 기록하는 가짜 Driver
function fakeDriver(options: { fail?: string } = {}) {
  const closed: string[] = [];
  let count = 0;
  const driver: Driver = {
    async connect(_mod, params) {
      if (options.fail) throw new Error(options.fail);
      const label = `${params.host}#${++count}`;
      return {
        serverVersion: `fake-${label}`,
        close: async () => {
          closed.push(label);
        },
      };
    },
  };
  return { driver, closed };
}

describe("ConnectionManager", () => {
  const loadDriver = vi.fn(async (name: string) => ({ name }));

  it("드라이버를 로드해 Driver로 접속하고 서버 버전을 돌려준다", async () => {
    const { driver } = fakeDriver();
    const manager = new ConnectionManager(loadDriver, { fake: driver });

    await expect(
      manager.connect("c1", "fake", { host: "db" }),
    ).resolves.toEqual({
      serverVersion: "fake-db#1",
    });
    expect(loadDriver).toHaveBeenCalledWith("fake");
    expect(manager.has("c1")).toBe(true);
  });

  it("같은 connectionId로 다시 접속하면 이전 세션을 닫는다", async () => {
    const { driver, closed } = fakeDriver();
    const manager = new ConnectionManager(loadDriver, { fake: driver });

    await manager.connect("c1", "fake", { host: "db" });
    await manager.connect("c1", "fake", { host: "db" });

    expect(closed).toEqual(["db#1"]);
    expect(manager.has("c1")).toBe(true);
  });

  it("접속에 실패하면 기존 세션을 유지한다", async () => {
    const ok = fakeDriver();
    const manager = new ConnectionManager(loadDriver, {
      fake: ok.driver,
      broken: fakeDriver({ fail: "Access denied" }).driver,
    });

    await manager.connect("c1", "fake", { host: "db" });
    await expect(manager.connect("c1", "broken", {})).rejects.toThrow(
      "Access denied",
    );

    expect(ok.closed).toEqual([]);
    expect(manager.has("c1")).toBe(true);
  });

  it("Driver가 없는 드라이버는 거부한다", async () => {
    const manager = new ConnectionManager(loadDriver, {});
    await expect(manager.connect("c1", "sqlite", {})).rejects.toThrow(
      "접속을 지원하지 않는 드라이버: sqlite",
    );
  });

  it("disconnectAll은 모든 세션을 닫는다", async () => {
    const { driver, closed } = fakeDriver();
    const manager = new ConnectionManager(loadDriver, { fake: driver });
    await manager.connect("a", "fake", { host: "x" });
    await manager.connect("b", "fake", { host: "y" });

    await manager.disconnectAll();

    expect(closed.sort()).toEqual(["x#1", "y#2"]);
    expect(manager.has("a") || manager.has("b")).toBe(false);
  });
});
