import type { QueryValue } from "@packages/utils/client";

// SELECT 결과 표. NULL은 흐리게 구분한다
export function QueryResultTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: QueryValue[][];
}) {
  return (
    <table className="min-w-full border-separate border-spacing-0 font-mono text-[12px] leading-normal">
      <thead className="sticky top-0 z-10 bg-[#071611]">
        <tr>
          {columns.map((column, i) => (
            <th
              key={i}
              className="border-r border-b border-[#1E3A30] px-3 py-1.5 text-left font-semibold whitespace-nowrap text-[#E6F2EC]"
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="hover:bg-[#12291F]">
            {row.map((value, c) => (
              <td
                key={c}
                title={value === null ? undefined : String(value)}
                className={`max-w-[480px] truncate border-r border-b border-[#1E3A30] px-3 py-1 whitespace-nowrap ${
                  typeof value === "number" ? "text-right" : ""
                } ${value === null ? "text-[#4F6B5F] italic" : "text-[#E6F2EC]"}`}
              >
                {value === null ? "NULL" : String(value)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
