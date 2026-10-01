import { ConnectionField } from "@packages/components";

export function MysqlGeneral() {
  return (
    <>
      <ConnectionField label={"Host"} />
      <ConnectionField label={"Port"} />
      <ConnectionField label={"User"} />
      <ConnectionField label={"Password"} inputType="password" />
      <ConnectionField label={"Database"} />
      <ConnectionField label={"Url"} />
    </>
  );
}
