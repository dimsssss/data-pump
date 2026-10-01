import { useState } from "react";
import type { ActiveConnection } from "@packages/utils/client";
import Workspace from "./workspace/views/Workspace";
import Connection from "./connection/views/Connection";

// 화면 전환: 접속 설정 화면에서 Apply하면 해당 접속으로 작업 화면(Workspace, SQL 편집기)을 연다
function App() {
  const [active, setActive] = useState<ActiveConnection | null>(null);

  return active ? (
    <Workspace connection={active} />
  ) : (
    <Connection onApply={setActive} />
  );
}

export default App;
