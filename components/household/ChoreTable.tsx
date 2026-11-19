"use client";

import { choreRotation, type Member } from "@/lib/agreement";
import { t } from "@/lib/strings";

const A = t.agreement;

/** Weekly chore rotation: chores × 4 weeks, the current user highlighted in navy. */
export function ChoreTable({ chores, members }: { chores: string[]; members: Member[] }) {
  const rows = choreRotation(chores, members);
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[340px] border-separate border-spacing-1 text-[13px]">
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              {A.chores.title}
            </th>
            {[1, 2, 3, 4].map((w) => (
              <th key={w} scope="col" className="whitespace-nowrap px-1 py-1 text-center font-medium text-ink-2">
                {A.chores.week(w)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.chore}>
              <th scope="row" className="max-w-[110px] py-1 pr-1 text-left font-medium leading-tight text-navy">
                {r.chore}
              </th>
              {r.weeks.map((m, w) => (
                <td
                  key={w}
                  className={`rounded-xl px-1 py-2 text-center font-medium ${
                    members.indexOf(m) === 0 ? "bg-navy text-white" : "bg-navy-50 text-navy"
                  }`}
                >
                  {m.firstName}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
