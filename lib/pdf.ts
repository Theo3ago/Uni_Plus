/**
 * Agreement → PDF (A4), generated entirely in the browser with jsPDF.
 * Real text (selectable, searchable), vector Uni+ logo, chore table, signatures,
 * and the "not a legal lease" note in every page footer.
 */
import type { jsPDF as JsPDF } from "jspdf";
import type { AgreementDocument } from "./agreementDoc";
import { t } from "./strings";

const NAVY: [number, number, number] = [19, 41, 75];
const ORANGE: [number, number, number] = [232, 119, 46];
const INK2: [number, number, number] = [58, 74, 102];
const LINE: [number, number, number] = [227, 231, 239];
const TINT: [number, number, number] = [238, 241, 247];

/** The built-in PDF fonts use WinAnsi: normalise characters outside it. */
const clean = (s: string) =>
  s
    .replace(/[  ]/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    // Emoji and other characters the built-in fonts can't draw would print as garbage
    // (e.g. "Ø=Þ"): drop them, then tidy the spaces they leave behind.
    .replace(/[^\u0000-ÿŒœŠšŸŽžƒˆ˜–—‚„†-•…‰‹›€™]/gu, "")
    .replace(/ {2,}/g, " ")
    .trim();

/** House + plus, scaled from the 200×200 SVG logo. */
function drawLogo(doc: JsPDF, x: number, y: number, size: number) {
  const s = size / 200;
  const P = (px: number, py: number): [number, number] => [x + px * s, y + py * s];
  doc.setLineCap("round");
  doc.setLineJoin("round");
  doc.setLineWidth(16 * s);
  doc.setDrawColor(...NAVY);
  const poly = (pts: [number, number][]) => {
    for (let i = 0; i < pts.length - 1; i++) doc.line(...pts[i], ...pts[i + 1]);
  };
  poly([P(28, 96), P(100, 34), P(172, 96)]);
  poly([P(50, 92), P(50, 166), P(150, 166), P(150, 92)]);
  doc.setDrawColor(...ORANGE);
  doc.line(...P(100, 102), ...P(100, 148));
  doc.line(...P(77, 125), ...P(123, 125));
}

export async function agreementPdf(d: AgreementDocument, fileName: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const CW = W - 2 * M;
  const FOOTER = 26;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > H - FOOTER) {
      doc.addPage();
      y = M;
    }
  };
  const text = (s: string, size: number, color: [number, number, number], style: "normal" | "bold" | "italic" = "normal", indent = 0) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean(s), CW - indent) as string[];
    const lh = size * 0.42;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, M + indent, y + lh * 0.8);
      y += lh;
    }
  };

  // Header
  drawLogo(doc, M, y - 2, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text("Uni", M + 18, y + 9);
  doc.setTextColor(...ORANGE);
  doc.text("+", M + 18 + doc.getTextWidth("Uni"), y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK2);
  doc.text(clean(d.status), W - M, y + 9, { align: "right" });
  y += 20;

  text(d.title, 20, NAVY, "bold");
  y += 1;
  text(d.parties, 11, INK2);
  y += 5;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;

  // Sections
  for (const s of d.sections) {
    ensure(14);
    text(s.title, 12.5, NAVY, "bold");
    y += 1.5;
    s.lines.forEach((line, i) => {
      const prefix = s.numbered ? `${i + 1}. ` : "";
      text(prefix + line, 10, INK2, "normal", s.numbered ? 2 : 0);
      y += 0.8;
    });

    if (s.table) {
      y += 2;
      const cols = s.table.head.length;
      const firstW = 48;
      const otherW = (CW - firstW) / (cols - 1);
      const rowH = 8;
      const drawRow = (cells: string[], header: boolean) => {
        ensure(rowH);
        cells.forEach((cell, c) => {
          const cx = c === 0 ? M : M + firstW + (c - 1) * otherW;
          const w = c === 0 ? firstW : otherW;
          if (!header && c > 0) {
            doc.setFillColor(...TINT);
            doc.roundedRect(cx + 0.8, y + 0.8, w - 1.6, rowH - 1.6, 1.5, 1.5, "F");
          }
          doc.setFont("helvetica", header || c === 0 ? "bold" : "normal");
          doc.setFontSize(9);
          doc.setTextColor(...(header ? INK2 : NAVY));
          const label = doc.splitTextToSize(clean(cell), w - 3)[0] as string;
          doc.text(label, c === 0 ? cx : cx + w / 2, y + rowH / 2 + 1.2, { align: c === 0 ? "left" : "center" });
        });
        y += rowH;
      };
      drawRow(s.table.head, true);
      s.table.rows.forEach((r) => drawRow(r, false));
    }
    y += 5;
  }

  // Signatures
  ensure(20 + d.signatures.length * 16);
  text(t.agreement.doc.sections.signatures, 12.5, NAVY, "bold");
  y += 3;
  const colW = (CW - 8) / 2;
  d.signatures.forEach((s, i) => {
    const col = i % 2;
    if (col === 0 && i > 0) y += 22;
    ensure(22);
    const x = M + col * (colW + 8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(15);
    doc.setTextColor(...NAVY);
    doc.text(clean(s.signature?.name ?? ""), x, y + 9);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.3);
    doc.line(x, y + 12, x + colW, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK2);
    doc.text(clean(`${s.member.firstName} - ${s.line}`), x, y + 17);
  });
  y += 24;

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.line(M, H - FOOTER + 4, W - M, H - FOOTER + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...INK2);
    const note = doc.splitTextToSize(clean(d.disclaimer), CW - 30) as string[];
    doc.text(note, M, H - FOOTER + 9);
    doc.text(`${p} / ${pages}`, W - M, H - FOOTER + 9, { align: "right" });
    doc.text(clean(t.agreement.doc.generatedBy), W - M, H - FOOTER + 13, { align: "right" });
  }

  doc.save(fileName);
}
