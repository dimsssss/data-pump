import { DriverBadge } from "./DriverBadge";

export type Driver = "mysql" | "sqlite";

export interface General {
  connectionType: string;
  driver: Driver;
  host: string;
  port?: number;
  authentication?: string;
  user?: string;
  password?: string;
  database?: string;
  url: string;
}

export interface ConnectionInfo {
  name: string;
  comment?: string;
  general: General;
}

export interface ConnectionItemProps {
  selected: boolean;
  info: ConnectionInfo;
  onSelect: () => void;
}

export const dummies: ConnectionInfo[] = [
  {
    name: "local-postgres",
    comment: "",
    general: {
      connectionType: "default",
      driver: "mysql",
      host: "./sample.sqlite3",
      port: 1234,
      authentication: "User & Password",
      user: "mysql",
      password: "1234",
      database: "sample-mysql",
      url: "mysql://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "sample-sqlite3",
    comment: "",
    general: {
      connectionType: "default",
      driver: "sqlite",
      host: "./sample.sqlite3",
      database: "sample-sqlitel",
      url: "sqlite://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "local-postgres",
    comment: "",
    general: {
      connectionType: "default",
      driver: "mysql",
      host: "./sample.sqlite3",
      port: 1234,
      authentication: "User & Password",
      user: "mysql",
      password: "1234",
      database: "sample-mysql",
      url: "mysql://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "sample-sqlite3",
    comment: "",
    general: {
      connectionType: "default",
      driver: "sqlite",
      host: "./sample.sqlite3",
      database: "sample-sqlitel",
      url: "sqlite://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "local-postgres",
    comment: "",
    general: {
      connectionType: "default",
      driver: "mysql",
      host: "./sample.sqlite3",
      port: 1234,
      authentication: "User & Password",
      user: "mysql",
      password: "1234",
      database: "sample-mysql",
      url: "mysql://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "sample-sqlite3",
    comment: "",
    general: {
      connectionType: "default",
      driver: "sqlite",
      host: "./sample.sqlite3",
      database: "sample-sqlitel",
      url: "sqlite://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "local-postgres",
    comment: "",
    general: {
      connectionType: "default",
      driver: "mysql",
      host: "./sample.sqlite3",
      port: 1234,
      authentication: "User & Password",
      user: "mysql",
      password: "1234",
      database: "sample-mysql",
      url: "mysql://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "sample-sqlite3",
    comment: "",
    general: {
      connectionType: "default",
      driver: "sqlite",
      host: "./sample.sqlite3",
      database: "sample-sqlitel",
      url: "sqlite://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "local-postgres",
    comment: "",
    general: {
      connectionType: "default",
      driver: "mysql",
      host: "./sample.sqlite3",
      port: 1234,
      authentication: "User & Password",
      user: "mysql",
      password: "1234",
      database: "sample-mysql",
      url: "mysql://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "sample-sqlite3",
    comment: "",
    general: {
      connectionType: "default",
      driver: "sqlite",
      host: "./sample.sqlite3",
      database: "sample-sqlitel",
      url: "sqlite://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "local-postgres",
    comment: "",
    general: {
      connectionType: "default",
      driver: "mysql",
      host: "./sample.sqlite3",
      port: 1234,
      authentication: "User & Password",
      user: "mysql",
      password: "1234",
      database: "sample-mysql",
      url: "mysql://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "sample-sqlite3",
    comment: "",
    general: {
      connectionType: "default",
      driver: "sqlite",
      host: "./sample.sqlite3",
      database: "sample-sqlitel",
      url: "sqlite://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "local-postgres",
    comment: "",
    general: {
      connectionType: "default",
      driver: "mysql",
      host: "./sample.sqlite3",
      port: 1234,
      authentication: "User & Password",
      user: "mysql",
      password: "1234",
      database: "sample-mysql",
      url: "mysql://mysql@localhost:1234/sample-mysql",
    },
  },
  {
    name: "sample-sqlite3",
    comment: "",
    general: {
      connectionType: "default",
      driver: "sqlite",
      host: "./sample.sqlite3",
      database: "sample-sqlitel",
      url: "sqlite://mysql@localhost:1234/sample-mysql",
    },
  },
];

const DRIVER_BADGES: Record<string, { label: string; color: string }> = {
  mysql: { label: "MY", color: "#00758F" },
  sqlite: { label: "SL", color: "#0F80CC" },
};

const FALLBACK_BADGE = { label: "DB", color: "#4B5563" };

export function ConnectionItem({
  info,
  selected,
  onSelect,
}: ConnectionItemProps) {
  const badge = DRIVER_BADGES[info.general.driver] ?? FALLBACK_BADGE;

  return (
    <li className="px-2">
      <button
        type="button"
        onClick={onSelect}
        data-selected={selected}
        aria-current={selected}
        className="group flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] px-2 py-1.5 text-left
                   active:bg-[#10362A]/60
                   data-[selected=true]:bg-[#10362A]"
      >
        <DriverBadge label={badge.label} color={badge.color} />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <p className="truncate text-xs/[normal] text-[#E6F2EC] group-data-[selected=true]:font-semibold">
            {info.name}
          </p>
          <p
            className="truncate text-[10px]/[normal] text-[#7F9A8E]"
            title={info.general.url}
          >
            {info.general.url}
          </p>
        </div>
      </button>
    </li>
  );
}
