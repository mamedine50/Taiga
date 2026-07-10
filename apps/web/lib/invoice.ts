import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type InvoiceData = {
  number: string;
  ref: string;
  originCity: string;
  destCity: string;
  subtotal: number | null;
  gst: number | null;
  qst: number | null;
  total: number | null;
  dateISO: string;
};

const money = (n: number | null): string => (n == null ? "-" : `${n.toFixed(2)} $`);

/** Génère la facture PDF (numérotée, TPS/TVQ, nos numéros de taxes). */
export async function generateInvoicePdf(d: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.043, 0.071, 0.118);
  const gray = rgb(0.4, 0.44, 0.5);
  const orange = rgb(1, 0.478, 0.16);

  const gstNo = process.env.TAIGA_GST_NUMBER ?? "";
  const qstNo = process.env.TAIGA_QST_NUMBER ?? "";

  page.drawText("TAIGA", { x: 50, y: 792, size: 26, font: bold, color: orange });
  page.drawText("Transport & logistique - Quebec", { x: 50, y: 774, size: 10, font, color: gray });

  let y = 720;
  const line = (
    text: string,
    opts: { size?: number; bold?: boolean; gap?: number; color?: ReturnType<typeof rgb> } = {},
  ) => {
    page.drawText(text, { x: 50, y, size: opts.size ?? 11, font: opts.bold ? bold : font, color: opts.color ?? ink });
    y -= opts.gap ?? 20;
  };

  line(`Facture ${d.number}`, { size: 15, bold: true, gap: 24 });
  line(`Date : ${d.dateISO.slice(0, 10)}`, { color: gray });
  line(`Expedition : ${d.ref}`);
  line(`Trajet : ${d.originCity} -> ${d.destCity}`, { gap: 30 });

  line("Detail", { bold: true });
  line(`Sous-total          ${money(d.subtotal)}`);
  line(`TPS (5%)            ${money(d.gst)}`);
  line(`TVQ (9,975%)        ${money(d.qst)}`, { gap: 26 });
  line(`Total               ${money(d.total)}`, { size: 14, bold: true, gap: 40 });

  line(`No TPS : ${gstNo}`, { size: 9, color: gray, gap: 14 });
  line(`No TVQ : ${qstNo}`, { size: 9, color: gray });

  return doc.save();
}
