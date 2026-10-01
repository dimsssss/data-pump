import { DriverSelect, type DriverName } from "@packages/components";
import { MysqlGeneral } from "./MysqlGeneral";
import { SqliteGeneral } from "./SqliteGeneral";
import type { ConnectionViewModel } from "../view-models/useConnectionViewModel";

export function GeneralTab({
  form,
  onChange,
  usesSavedPassword,
}: {
  form: ConnectionViewModel["form"];
  onChange: ConnectionViewModel["setField"];
  usesSavedPassword: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <DriverSelect
        value={form.driver as DriverName}
        label={"Driver"}
        onChange={(v) => onChange("driver", v)}
      />
      {form.driver === "mysql" ? (
        <MysqlGeneral
          form={form}
          onChange={onChange}
          usesSavedPassword={usesSavedPassword}
        />
      ) : (
        <SqliteGeneral form={form} onChange={onChange} />
      )}
    </div>
  );
}
