import { ConnectionField } from "@packages/components";

export function SqlliteGeneral() {
  return (
    <>
      <ConnectionField label={"Host"} />
      <ConnectionField label={"Url"} />
    </>
  );
}
