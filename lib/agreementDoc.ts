/**
 * The agreement as a document: ordered sections of plain text lines (plus the chore table).
 * Rendered by the printable page AND the PDF, so both always say the same thing.
 */
import { choreRotation, isFullySigned, monthlyShares, type Agreement, type Member, type Signature } from "./agreement";
import { formatDate, formatMoney, formatTime } from "./format";
import { t } from "./strings";

const A = t.agreement;
const D = A.doc;

export interface DocSection {
  title: string;
  lines: string[];
  bullets?: boolean;
  numbered?: boolean;
  table?: { head: string[]; rows: string[][] };
}

export interface AgreementDocument {
  title: string;
  parties: string;
  status: string;
  signed: boolean;
  sections: DocSection[];
  signatures: { member: Member; signature?: Signature; line: string }[];
  disclaimer: string;
}

const join = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} et ${names.at(-1)}`;

export function signatureDate(iso: string) {
  const d = new Date(iso);
  return `${formatDate(iso.slice(0, 10))} à ${formatTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`)}`;
}

export function buildAgreementDocument(
  a: Agreement,
  members: Member[],
  signatures: Record<string, Signature>,
): AgreementDocument {
  const shares = monthlyShares(a, members);
  const signed = isFullySigned(signatures, members);
  const P = A.petsSmoking;

  const sections: DocSection[] = [
    {
      title: D.sections.rent,
      lines: [
        `${D.monthlyTotal} : ${formatMoney(a.rent.total)}, ${a.rent.mode === "equal" ? D.sharesEqual : D.sharesCustom}.`,
        ...shares.map((s) => `${s.member.firstName} : ${Math.round(s.percent)} % = ${formatMoney(s.rent)} par mois`),
      ],
    },
    {
      title: D.sections.utilities,
      lines: [
        D.utilitiesLine(formatMoney(a.utilities.monthly), formatMoney(a.utilities.internet)),
        a.utilities.mode === "equal" ? D.utilitiesEqual : D.utilitiesRent,
        `${D.monthlyPerPerson} :`,
        ...shares.map((s) => `${s.member.firstName} : ${formatMoney(s.total)}`),
      ],
    },
    {
      title: D.sections.chores,
      lines: [A.chores.body],
      table: {
        head: ["", ...[1, 2, 3, 4].map((w) => A.chores.week(w))],
        rows: choreRotation(a.chores, members).map((r) => [r.chore, ...r.weeks.map((m) => m.firstName)]),
      },
    },
    {
      title: D.sections.quiet,
      lines: [
        D.quietLine(A.quiet.weekdays, formatTime(a.quiet.weekdayFrom), formatTime(a.quiet.weekdayTo)),
        D.quietLine(A.quiet.weekends, formatTime(a.quiet.weekendFrom), formatTime(a.quiet.weekendTo)),
        ...(a.quiet.examExtended ? [D.examExtended] : []),
      ],
    },
    {
      title: D.sections.guests,
      lines: [
        ...(a.guests.notice ? [D.noticeYes] : []),
        D.overnight(a.guests.overnightPerWeek),
        ...(a.guests.partnerRule ? [D.partnerYes] : []),
      ],
    },
    {
      title: D.sections.cleanliness,
      lines: [D.level(a.cleanliness.level, t.labels.cleanliness[a.cleanliness.level]), ...a.cleanliness.rules],
    },
    {
      title: D.sections.groceries,
      lines: [
        a.groceries.mode === "shared"
          ? D.groceriesShared(formatMoney(a.groceries.budget))
          : a.groceries.mode === "separate"
            ? D.groceriesSeparate
            : D.groceriesMixed,
      ],
    },
    {
      title: D.sections.petsSmoking,
      lines: [
        D.pets({ no: P.petsNo, yes: P.petsYes, ask: P.petsAsk }[a.pets].toLowerCase()),
        D.smoking({ no: P.smokeNo, outside: P.smokeOutside, yes: P.smokeYes }[a.smoking].toLowerCase()),
      ],
    },
    { title: D.sections.conflict, lines: a.conflictSteps, numbered: true },
    {
      title: D.sections.lease,
      lines: [D.leaseLine(a.lease.moveIn ? formatDate(a.lease.moveIn) : "—", A.lease.months(a.lease.months))],
    },
    ...(a.notes.trim() ? [{ title: D.sections.notes, lines: a.notes.trim().split(/\n+/) }] : []),
  ];

  return {
    title: D.title,
    parties: `${D.between} ${join(members.map((m) => signatures[m.id]?.name ?? m.firstName))}`,
    status: signed ? D.status.signed : D.status.draft,
    signed,
    sections,
    signatures: members.map((m) => ({
      member: m,
      signature: signatures[m.id],
      line: signatures[m.id] ? D.signedOn(signatureDate(signatures[m.id].signedAt)) : D.notSigned,
    })),
    disclaimer: A.notLegal,
  };
}
