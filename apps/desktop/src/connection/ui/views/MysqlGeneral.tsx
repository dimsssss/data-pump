import { Field } from "@packages/components";
import type { ConnectionViewModel } from "../view-models/useConnectionViewModel";

export function MysqlGeneral({
  form,
  onChange,
  usesSavedPassword,
}: {
  form: ConnectionViewModel["form"];
  onChange: ConnectionViewModel["setField"];
  usesSavedPassword: boolean;
}) {
  return (
    <>
      <Field
        label={"Host"}
        value={form.host}
        onChange={(v) => onChange("host", v)}
        placeholder="localhost"
      />
      <Field
        label={"Port"}
        value={form.port}
        onChange={(v) => onChange("port", v)}
        placeholder="3306"
      />
      <Field
        label={"User"}
        value={form.user}
        onChange={(v) => onChange("user", v)}
      />
      <Field
        label={"Password"}
        inputType="password"
        value={form.password}
        onChange={(v) => onChange("password", v)}
        placeholder={
          usesSavedPassword
            ? "저장된 비밀번호 사용 (변경하려면 입력)"
            : undefined
        }
      />
      <Field
        label={"Database"}
        value={form.database}
        onChange={(v) => onChange("database", v)}
      />
      <Field
        label={"Url"}
        value={form.url}
        onChange={(v) => onChange("url", v)}
        placeholder="mysql://user@host:3306/db (Host가 비어 있을 때 사용)"
      />
    </>
  );
}
