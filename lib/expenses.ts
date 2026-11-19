/**
 * Bill splitting: net balance per person, then the fewest transfers to settle up
 * (greedy: largest debtor pays largest creditor). Amounts in cents to avoid rounding drift.
 */
import type { Expense } from "./data/households";

export function balances(expenses: Expense[], memberIds: string[]): Record<string, number> {
  const net: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]));
  for (const e of expenses) {
    const among = e.splitAmong.filter((id) => id in net);
    if (!among.length || !(e.paidBy in net)) continue;
    const base = Math.floor(e.amountCents / among.length);
    let remainder = e.amountCents - base * among.length;
    net[e.paidBy] += e.amountCents;
    for (const id of among) {
      const share = base + (remainder-- > 0 ? 1 : 0);
      net[id] -= share;
    }
  }
  return net;
}

export interface Transfer {
  from: string;
  to: string;
  amountCents: number;
}

export function settleUp(net: Record<string, number>): Transfer[] {
  const debtors = Object.entries(net)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, v: -v }))
    .sort((a, b) => b.v - a.v);
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, v }))
    .sort((a, b) => b.v - a.v);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].v, creditors[j].v);
    if (amount > 0) out.push({ from: debtors[i].id, to: creditors[j].id, amountCents: amount });
    debtors[i].v -= amount;
    creditors[j].v -= amount;
    if (debtors[i].v === 0) i++;
    if (creditors[j].v === 0) j++;
  }
  return out;
}

export const totalSpent = (expenses: Expense[]) =>
  expenses.filter((e) => !e.settlement).reduce((s, e) => s + e.amountCents, 0);
