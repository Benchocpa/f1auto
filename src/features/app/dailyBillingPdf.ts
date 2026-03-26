import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { StoreName, VehicleEntry } from "./types";
import { formatCurrency } from "./utils";

interface DailyBillingPdfParams {
  store: StoreName;
  logoKey?: string;
  vehicles: VehicleEntry[];
  generatedAt?: Date;
}

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN_X = 36;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 42;
const TABLE_TOP_OFFSET = 128;
const HEADER_ROW_HEIGHT = 24;

const COLUMNS = [
  { label: "Stock", width: 48 },
  { label: "Make", width: 58 },
  { label: "Model", width: 64 },
  { label: "VIN", width: 54 },
  { label: "Sales Person", width: 66 },
  { label: "Time", width: 42 },
  { label: "SIMO", width: 40 },
  { label: "Comments", width: 140 },
  { label: "Price", width: 64 },
] as const;

function sanitizeText(value: string | null | undefined) {
  return (value || "-").replace(/\s+/g, " ").trim() || "-";
}

function formatBillingDate(value: Date) {
  return value.toLocaleDateString("en-US");
}

function wrapText(text: string, maxWidth: number, font: any, size: number) {
  const safeText = sanitizeText(text);
  const words = safeText.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    const nextWidth = font.widthOfTextAtSize(nextLine, size);

    if (nextWidth <= maxWidth || !currentLine) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : ["-"];
}

async function loadLogoBytes(logoKey: string) {
  if (typeof window === "undefined") return null;

  const response = await fetch(`/brands/${logoKey}.svg`);
  if (!response.ok) return null;

  const svgText = await response.text();
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load brand logo."));
      img.src = blobUrl;
    });

    const width = image.naturalWidth || 240;
    const height = image.naturalHeight || 120;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) return null;

    context.drawImage(image, 0, 0, width, height);

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/png");
    });

    if (!pngBlob) return null;
    return new Uint8Array(await pngBlob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function buildRows(vehicles: VehicleEntry[]) {
  return vehicles.map((entry) => ({
    stock: sanitizeText(entry.stock),
    make: sanitizeText(entry.make),
    model: sanitizeText(entry.model),
    vin: sanitizeText(entry.vin),
    salesPerson: sanitizeText(entry.salesPerson),
    time: sanitizeText(entry.time),
    simo: sanitizeText(entry.simo),
    comments: sanitizeText(entry.comments),
    price: formatCurrency(entry.price),
  }));
}

export async function generateDailyBillingPdf({
  store,
  logoKey,
  vehicles,
  generatedAt = new Date(),
}: DailyBillingPdfParams) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = logoKey ? await loadLogoBytes(logoKey) : null;
  const logoImage = logoBytes ? await pdf.embedPng(logoBytes) : null;
  const rows = buildRows(vehicles);
  const totalAmount = vehicles.reduce((sum, vehicle) => sum + vehicle.price, 0);

  let page = pdf.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
  let cursorY = LETTER_HEIGHT - TABLE_TOP_OFFSET;

  const drawPageHeader = (targetPage: typeof page, pageNumber: number) => {
    targetPage.drawText("F1 AUTO DETAILS", {
      x: MARGIN_X,
      y: LETTER_HEIGHT - MARGIN_TOP - 4,
      size: 15,
      font: fontBold,
      color: rgb(0.08, 0.08, 0.1),
    });

    targetPage.drawText("DAILY BILLING", {
      x: MARGIN_X,
      y: LETTER_HEIGHT - MARGIN_TOP - 22,
      size: 11,
      font: fontBold,
      color: rgb(0.16, 0.16, 0.18),
    });

    targetPage.drawText(store, {
      x: MARGIN_X,
      y: LETTER_HEIGHT - MARGIN_TOP - 40,
      size: 12,
      font: fontBold,
      color: rgb(0.16, 0.16, 0.18),
    });

    targetPage.drawText(`DATE  ${formatBillingDate(generatedAt)}`, {
      x: MARGIN_X,
      y: LETTER_HEIGHT - MARGIN_TOP - 58,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.32),
    });

    targetPage.drawText(`VEHICLES  ${vehicles.length}`, {
      x: MARGIN_X + 130,
      y: LETTER_HEIGHT - MARGIN_TOP - 58,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.32),
    });

    targetPage.drawText(`TOTAL AMOUNT  ${formatCurrency(totalAmount)}`, {
      x: MARGIN_X + 230,
      y: LETTER_HEIGHT - MARGIN_TOP - 58,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.32),
    });

    targetPage.drawText(`PAGE ${pageNumber}`, {
      x: LETTER_WIDTH - MARGIN_X - 46,
      y: LETTER_HEIGHT - MARGIN_TOP - 58,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.32),
    });

    if (logoImage) {
      const maxWidth = 72;
      const maxHeight = 40;
      const scale = Math.min(maxWidth / logoImage.width, maxHeight / logoImage.height, 1);
      const width = logoImage.width * scale;
      const height = logoImage.height * scale;

      targetPage.drawImage(logoImage, {
        x: LETTER_WIDTH - MARGIN_X - width,
        y: LETTER_HEIGHT - MARGIN_TOP - height,
        width,
        height,
      });
    }

    targetPage.drawLine({
      start: { x: MARGIN_X, y: LETTER_HEIGHT - MARGIN_TOP - 72 },
      end: { x: LETTER_WIDTH - MARGIN_X, y: LETTER_HEIGHT - MARGIN_TOP - 72 },
      thickness: 1,
      color: rgb(0.14, 0.14, 0.16),
    });

    let x = MARGIN_X;
    const headerY = LETTER_HEIGHT - TABLE_TOP_OFFSET;

    for (const column of COLUMNS) {
      targetPage.drawRectangle({
        x,
        y: headerY,
        width: column.width,
        height: HEADER_ROW_HEIGHT,
        borderWidth: 0.8,
        borderColor: rgb(0.16, 0.16, 0.18),
        color: rgb(0.97, 0.97, 0.96),
      });

      targetPage.drawText(column.label, {
        x: x + 3,
        y: headerY + 8,
        size: 7,
        font: fontBold,
        color: rgb(0.16, 0.16, 0.18),
      });

      x += column.width;
    }
  };

  let pageNumber = 1;
  drawPageHeader(page, pageNumber);

  for (const row of rows) {
    const lineSets = [
      wrapText(row.stock, COLUMNS[0].width - 6, fontRegular, 8),
      wrapText(row.make, COLUMNS[1].width - 6, fontRegular, 8),
      wrapText(row.model, COLUMNS[2].width - 6, fontRegular, 8),
      wrapText(row.vin, COLUMNS[3].width - 6, fontRegular, 8),
      wrapText(row.salesPerson, COLUMNS[4].width - 6, fontRegular, 8),
      wrapText(row.time, COLUMNS[5].width - 6, fontRegular, 8),
      wrapText(row.simo, COLUMNS[6].width - 6, fontRegular, 8),
      wrapText(row.comments, COLUMNS[7].width - 6, fontRegular, 8),
      wrapText(row.price, COLUMNS[8].width - 6, fontRegular, 8),
    ];

    const maxLines = Math.max(...lineSets.map((lines) => lines.length));
    const rowHeight = Math.max(20, maxLines * 10 + 6);

    if (cursorY - rowHeight < MARGIN_BOTTOM) {
      page = pdf.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
      pageNumber += 1;
      drawPageHeader(page, pageNumber);
      cursorY = LETTER_HEIGHT - TABLE_TOP_OFFSET;
    }

    let x = MARGIN_X;
    const rowY = cursorY - rowHeight;

    lineSets.forEach((lines, index) => {
      const column = COLUMNS[index];

      page.drawRectangle({
        x,
        y: rowY,
        width: column.width,
        height: rowHeight,
        borderWidth: 0.8,
        borderColor: rgb(0.18, 0.18, 0.2),
      });

      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: x + 3,
          y: rowY + rowHeight - 11 - lineIndex * 9,
          size: 8,
          font: fontRegular,
          color: rgb(0.12, 0.12, 0.14),
        });
      });

      x += column.width;
    });

    cursorY = rowY;
  }

  const footerY = cursorY - 26;
  if (footerY < MARGIN_BOTTOM) {
    page = pdf.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
    pageNumber += 1;
    drawPageHeader(page, pageNumber);
    cursorY = LETTER_HEIGHT - TABLE_TOP_OFFSET;
  }

  page.drawText(`TOTAL AMOUNT  ${formatCurrency(totalAmount)}`, {
    x: LETTER_WIDTH - MARGIN_X - 170,
    y: cursorY - 22,
    size: 11,
    font: fontBold,
    color: rgb(0.12, 0.12, 0.14),
  });

  return pdf.save();
}
