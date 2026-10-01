import { useState } from "react";
import { ConnectionItem, dummies } from "./ConnectionItem";

export function ConnectionList() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return (
    <ul className="">
      {dummies.map((info, index) => (
        <ConnectionItem
          key={index}
          info={info}
          selected={selectedId === index}
          onSelect={() => setSelectedId(index)}
        />
      ))}
    </ul>
  );
}
