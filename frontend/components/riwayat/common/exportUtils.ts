"use client";
// import node module libraries
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string; // judul kolom yang tampil di file export
  key: string; // nama field pada object data (top-level)
  width?: number; // lebar kolom Excel (opsional)
}

// Info tambahan yang tampil di blok "informasi laporan" (semua opsional)
export interface ExportOptions {
  jenisLaporan?: string; // default: title
  filterLabel?: string; // default: "Semua data"
  ringkasan?: string; // baris "Ringkasan Status" (opsional)
  dicetakOleh?: string; // default: dibaca dari localStorage
}

// ====================== PENGATURAN ======================
// Path logo PLN -- taruh file logo di folder public/ project kamu,
// sesuaikan path ini kalau nama/lokasi filenya beda.
const LOGO_PATH = "/images/brand/Logo-PLN-polos.png";

const SYSTEM_NAME = "PULSE PUSHARLIS";

const KOP = {
  perusahaan: "PT PLN (PERSERO) PUSHARLIS",
  unit: "UNIT PELAKSANA PRODUKSI DAN WORKSHOP III",
  alamat: "Jl. Banten No. 10 Bandung 40272",
  kontak:
    "Telp (022) 7236791, 7236792, 7236793 Faks (022) 7236794 | e-mail: pusharlis@pln.co.id",
};

const BLUE_RGB: [number, number, number] = [15, 107, 240];
const BLUE_ARGB = "FF0F6BF0";
// ========================================================

// ---------- Logo (di-cache supaya tidak fetch berulang) ----------
let cachedLogoBuffer: ArrayBuffer | null = null;
async function getLogoBuffer(): Promise<ArrayBuffer | null> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    cachedLogoBuffer = await res.arrayBuffer();
    return cachedLogoBuffer;
  } catch {
    return null; // logo tidak ketemu -> export tetap jalan tanpa logo
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Ukuran asli gambar, dipakai supaya logo tidak gepeng
function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

// ---------- Helper umum ----------
const cellText = (v: unknown): string =>
  v === null || v === undefined || v === "" ? "-" : String(v);

const getTanggalCetak = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Nama pencetak: coba beberapa kunci localStorage, terakhir pakai role.
// Sesuaikan kuncinya kalau app kamu menyimpan nama user dengan kunci lain.
const getDicetakOleh = (): string => {
  try {
    for (const k of ["userName", "userNama", "nama", "name"]) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    const role = localStorage.getItem("userRole");
    if (role) return role.replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    /* abaikan */
  }
  return "-";
};

const toLaporanTitle = (title: string): string => {
  const t = title.trim().toUpperCase();
  return t.startsWith("LAPORAN") ? t : `LAPORAN ${t}`;
};

const buildMeta = (total: number, title: string, options: ExportOptions) => {
  const left: [string, string][] = [
    ["Nama Sistem", SYSTEM_NAME],
    ["Jenis Laporan", options.jenisLaporan || title],
    ["Filter Status", options.filterLabel || "Semua data"],
  ];
  const right: [string, string][] = [
    ["Tanggal Cetak", getTanggalCetak()],
    ["Dicetak Oleh", options.dicetakOleh || getDicetakOleh()],
    ["Jumlah Data", `${total} data`],
  ];
  if (options.ringkasan) right.push(["Ringkasan Status", options.ringkasan]);
  return { left, right };
};

// ====================== EXPORT EXCEL ======================
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  title: string = fileName.replace(/[_-]+/g, " "),
  options: ExportOptions = {}
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Laporan", {
    views: [{ showGridLines: false }],
  });

  const n = Math.max(columns.length, 4); // jumlah kolom lebar laporan
  const split = Math.ceil(n / 2); // pembagi blok info kiri/kanan

  // ---- Lebar kolom ----
  for (let i = 0; i < n; i++) {
    const col = columns[i];
    let width = col?.width ?? 12;
    if (col && !col.width) {
      const longest = data.reduce(
        (m, r) => Math.max(m, cellText(r[col.key]).length),
        col.header.length
      );
      width = Math.min(Math.max(longest + 4, 12), 50);
    }
    if (i === 0 || i === split) width = Math.max(width, 18); // kolom label info
    sheet.getColumn(i + 1).width = width;
  }

  // ---- Logo ----
  const logoBuffer = await getLogoBuffer();
  if (logoBuffer) {
    const dataUrl = `data:image/png;base64,${arrayBufferToBase64(logoBuffer)}`;
    const { w, h } = await getImageSize(dataUrl);
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" });
    sheet.addImage(imageId, {
      tl: { col: 0.1, row: 0.2 },
      ext: { width: 56, height: (56 * h) / w },
    });
  }

  // ---- Kop surat (mulai kolom B sampai akhir) ----
  const kop: [string, number, boolean][] = [
    [KOP.perusahaan, 14, true],
    [KOP.unit, 10, true],
    [KOP.alamat, 9, false],
    [KOP.kontak, 9, false],
  ];
  kop.forEach(([text, size, bold], i) => {
    const r = i + 1;
    sheet.mergeCells(r, 2, r, n);
    const cell = sheet.getCell(r, 2);
    cell.value = text;
    cell.font = { name: "Arial", size, bold };
    cell.alignment = { vertical: "middle" };
    sheet.getRow(r).height = i === 0 ? 20 : 15;
  });

  // ---- Garis ganda + judul ----
  const garis = (r: number, style: "thick" | "thin", height: number) => {
    sheet.getRow(r).height = height;
    for (let c = 1; c <= n; c++) {
      sheet.getCell(r, c).border = {
        bottom: { style, color: { argb: "FF000000" } },
      };
    }
  };
  garis(5, "thick", 5);
  garis(6, "thin", 5);

  sheet.mergeCells(7, 1, 7, n);
  const titleCell = sheet.getCell(7, 1);
  titleCell.value = toLaporanTitle(title);
  titleCell.font = { name: "Arial", size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  garis(7, "thin", 28);

  // ---- Blok info laporan (2 kolom) ----
  const { left, right } = buildMeta(data.length, title, options);
  const metaRows = Math.max(left.length, right.length);
  for (let i = 0; i < metaRows; i++) {
    const r = 8 + i;
    sheet.getRow(r).height = 16;
    const put = (
      pair: [string, string] | undefined,
      labelCol: number,
      endCol: number
    ) => {
      if (!pair) return;
      const label = sheet.getCell(r, labelCol);
      label.value = pair[0];
      label.font = { name: "Arial", size: 10 };
      if (labelCol + 1 < endCol) sheet.mergeCells(r, labelCol + 1, r, endCol);
      const val = sheet.getCell(r, labelCol + 1);
      val.value = `: ${pair[1]}`;
      val.font = { name: "Arial", size: 10 };
      val.alignment = { horizontal: "left", vertical: "middle" };
    };
    put(left[i], 1, split);
    put(right[i], split + 1, n);
  }
  const metaEnd = 8 + metaRows;
  garis(metaEnd, "thin", 8);

  // ---- Header kolom ----
  const headerRowIdx = metaEnd + 2;
  const headerRow = sheet.getRow(headerRowIdx);
  headerRow.height = 24;
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_ARGB } };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  });

  // ---- Baris data (zebra) ----
  data.forEach((row, idx) => {
    const dataRow = sheet.getRow(headerRowIdx + 1 + idx);
    dataRow.height = 22;
    columns.forEach((col, i) => {
      const raw = row[col.key];
      const cell = dataRow.getCell(i + 1);
      cell.value = typeof raw === "number" ? raw : cellText(raw);
      cell.font = { name: "Arial", size: 9, color: { argb: "FF595959" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1,
        wrapText: true,
      };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F7" } };
      }
    });
  });

  sheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ====================== EXPORT PDF ======================
export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  fileName: string,
  title: string,
  options: ExportOptions = {}
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 30; // margin kiri/kanan

  // ---- Kop surat ----
  const top = 28;
  const logoH = 46;
  let textX = M + logoH + 14;

  const logoBuffer = await getLogoBuffer();
  if (logoBuffer) {
    const dataUrl = `data:image/png;base64,${arrayBufferToBase64(logoBuffer)}`;
    const { w, h } = await getImageSize(dataUrl);
    const logoW = (logoH * w) / h;
    doc.addImage(dataUrl, "PNG", M, top, logoW, logoH, "LOGO", "FAST");
    textX = M + logoW + 14;
  } else {
    // fallback kalau file logo tidak ditemukan
    doc.setFillColor(255, 194, 14);
    doc.rect(M, top, logoH, logoH, "F");
    doc.setTextColor(11, 107, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PLN", M + logoH / 2, top + logoH / 2 + 4, { align: "center" });
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(KOP.perusahaan, textX, top + 12);
  doc.setFontSize(8.5);
  doc.text(KOP.unit, textX, top + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(KOP.alamat, textX, top + 38);
  doc.text(KOP.kontak, textX, top + 48);

  // ---- Garis ganda + judul ----
  let y = top + logoH + 14;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(2.5);
  doc.line(M, y, pageW - M, y);
  doc.setLineWidth(0.6);
  doc.line(M, y + 3.5, pageW - M, y + 3.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(toLaporanTitle(title), pageW / 2, y + 24, { align: "center" });

  y += 34;
  doc.setLineWidth(0.6);
  doc.line(M, y, pageW - M, y);

  // ---- Blok info laporan (2 kolom) ----
  const { left, right } = buildMeta(data.length, title, options);

  const drawRows = (
    rows: [string, string][],
    labelX: number,
    valueX: number,
    maxW: number,
    startY: number
  ) => {
    let yy = startY;
    doc.setFontSize(8.5);
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.text(label, labelX, yy);
      const lines = doc.splitTextToSize(`: ${value}`, maxW) as string[];
      doc.text(lines, valueX, yy);
      yy += 13 * lines.length;
    });
    return yy;
  };

  const rightLabelX = pageW * 0.54;
  const yLeft = drawRows(left, M, M + 100, rightLabelX - M - 110, y + 16);
  const yRight = drawRows(
    right,
    rightLabelX,
    rightLabelX + 100,
    pageW - M - rightLabelX - 100,
    y + 16
  );
  const yMeta = Math.max(yLeft, yRight) - 4;
  doc.line(M, yMeta, pageW - M, yMeta);

  // ---- Tabel ----
  autoTable(doc, {
    startY: yMeta + 14,
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((c) => cellText(row[c.key]))),
    theme: "plain",
    margin: { left: M, right: M, bottom: 36 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: [90, 90, 90],
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BLUE_RGB,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [247, 247, 247] },
  });

  // ---- Nomor halaman ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Halaman ${i} dari ${pages}`, pageW - M, pageH - 18, { align: "right" });
  }

  doc.save(`${fileName}.pdf`);
}

// ---- Helper: Generate Nama File Export Dinamis ----
export function getFilteredExportFileName(baseName: string, filterName?: string): string {
  // Ambil tanggal hari ini (Format: YYYY-MM-DD)
  const dateStr = new Date().toISOString().split("T")[0];
  let fileName = baseName;

  // Jika ada filter nama dan bukan "Semua", tambahkan nama tersebut ke file
  if (filterName && filterName !== "Semua") {
    // Ganti spasi dengan underscore agar nama file rapi
    const sanitizedFilter = filterName.replace(/\s+/g, "_");
    fileName += `_${sanitizedFilter}`;
  }

  // Gabungkan semua menjadi: BaseName_NamaPeminjam_Tanggal
  return `${fileName}_${dateStr}`;
}