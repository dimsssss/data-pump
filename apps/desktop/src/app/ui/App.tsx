import Workspace from "../../database/ui/views/Workspace";
import Connection from "../../connection/ui/views/Connection";
import { useAppViewModel } from "./view-models/useAppViewModel";

// 화면 전환: 접속 설정 화면에서 Apply하면 해당 접속으로 작업 화면(Workspace, SQL 편집기)을 연다
function App() {
  const { state, open, leave } = useAppViewModel();

  // main에 현재 접속을 묻는 짧은 순간에는 아무것도 그리지 않는다 (화면 깜박임 방지)
  if (state.kind === "loading") return null;

  return state.active ? (
    <Workspace connection={state.active} onLeave={leave} />
  ) : (
    <Connection onApply={open} />
  );
}

export default App;
