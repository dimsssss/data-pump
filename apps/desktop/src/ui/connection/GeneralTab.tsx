import { ConnectionDropbox } from "@packages/components";
import { useState } from "react";
import { Driver } from "../../../../../packages/components/ConnectionItem";
import { MysqlGeneral } from "./MySqlGeneral";
import { SqlliteGeneral } from "./SqlliteGeneral";

export function GeneralTab() {
  const [currentDriver, setCurrentDriver] = useState<Driver>("mysql");

  return (
    <div className="flex flex-col gap-2">
      <ConnectionDropbox
        value={currentDriver}
        label={"Driver"}
        onChange={(v) => {
          setCurrentDriver(v);
        }}
      />
      {currentDriver === "mysql" ? <MysqlGeneral /> : <SqlliteGeneral />}
    </div>
  );
}
