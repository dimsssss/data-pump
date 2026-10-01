import { useState, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import "./index.css";

function SqlEditor({ className = "" }: { className: string }) {
  const [value, setValue] = useState("");
  const onChange = useCallback((val: string) => setValue(val), []);
  return (
    <div className={`h-full ${className}`}>
      <CodeMirror
        className={`h-full w-full min-w-0 ${className}`}
        value={value}
        theme={"dark"}
        height="100%"
        width="100%"
        extensions={[sql()]}
        onChange={onChange}
      />
    </div>
  );
}

export default SqlEditor;
