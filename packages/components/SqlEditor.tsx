import { useMemo, useRef } from "react";
import CodeMirror, { keymap, Prec } from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";

function SqlEditor({
  value,
  onChange,
  onRun,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  // Cmd/Ctrl+Enter로 실행
  onRun?: () => void;
  className?: string;
}) {
  // 확장을 다시 만들지 않도록 최신 onRun은 ref로 읽는다
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  const extensions = useMemo(
    () => [
      sql(),
      // 기본 keymap의 Mod-Enter(빈 줄 삽입)보다 먼저 처리한다
      Prec.highest(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onRunRef.current?.();
              return true;
            },
          },
        ]),
      ),
    ],
    [],
  );

  return (
    <div className={`h-full ${className}`}>
      <CodeMirror
        className="h-full w-full min-w-0"
        value={value}
        theme={"dark"}
        height="100%"
        width="100%"
        extensions={extensions}
        onChange={onChange}
      />
    </div>
  );
}

export default SqlEditor;
