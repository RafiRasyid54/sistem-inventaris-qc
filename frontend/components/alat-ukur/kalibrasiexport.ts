// =====================================================================
// EXPORT LAPORAN KALIBRASI  (Excel via exceljs, PDF via jspdf)
// Meniru sheet "Kalibrasi" pada file
// "Laporan_Status_Kalibrasi_dan_Laporan_Pemeliharaan_Mesin_UP2W3":
//   - lebar kolom, tinggi baris, merge, border, font, logo = sama
//   - PDF digambar sel demi sel dengan ukuran yang sama seperti Excel
//     (fit-to-width, A4 landscape, header 1-12 berulang di tiap halaman)
//
// Perlu:  npm i exceljs jspdf
// Logo :  public/images/laporan/logo-pln.jpeg  &  logo-k3.jpeg
// =====================================================================
import { AlatUkur } from "../../types/DataAlatUkurTypes";

// ---- Sesuaikan nama field dengan type AlatUkur kamu bila berbeda ----
const KAL_FIELD_KEYS = {
  spesifikasi: ["spesifikasi", "spesifikasi_alat", "spec", "rentang"],
  kalibrasi: ["tanggal_kalibrasi_terakhir", "kalibrasi"],
  rencana: ["tanggal_kalibrasi_selanjutnya", "rencana_kalibrasi"],
  keterangan: ["keterangan", "catatan"],
};

const BULAN_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// lebar kolom (karakter) persis template: A..O
const KAL_COL_WIDTHS = [9.33, 33.44, 3.11, 25.33, 18.55, 22.66, 16.33, 18.33, 17.44, 18.66, 19.55, 16, 13.55, 2.55, 14.55];
const KAL_LAST_COL = 15; // kolom O

// tinggi baris template (pt)
const ROW_BASE = 14.4; // tinggi baris default sheet
const HEAD_ROWS_PT = [15.75, 15.75, 15.75, 15.75, 27.45, 12.75, 12.75, 12.75, 12.75, 4.5, 24.75, 18.75];

// teks kop (kotak tengah baris 1-5)
const KAL_KOP_LINES: { text: string; bold?: boolean }[] = [
  { text: "PT. PLN (PERSERO)", bold: true },
  { text: "PUSAT PEMELIHARAAN KETENAGALISTRIKAN", bold: true },
  { text: "Jl. Banten No. 10 Bandung 40272" },
  { text: "Telp. (022) 7236791, 7236792, 7236793  Faks  (022)  7236794" },
  { text: "e-mail : pusharlis@pln.co.id" },
];

// lebar kolom Excel -> px, dan kotak logo (px dari pojok kiri-atas sheet)
const kalPx = (w: number) => Math.round(w * 7 + 5);
const kalColStartPx = (i: number) => KAL_COL_WIDTHS.slice(0, i).reduce((a, w) => a + kalPx(w), 0);
const KAL_LOGO_PLN = { x: 31, y: 12, w: 130, h: 96 };
const KAL_LOGO_K3 = { x: kalColStartPx(13), y: 20, w: kalPx(KAL_COL_WIDTHS[13]) + 45, h: 63 };

// logo dimuat dengan proporsi ASLI, dipusatkan di dalam kotaknya (tidak di-gepengkan)
const kalContain = (
  size: { w: number; h: number } | null,
  box: { x: number; y: number; w: number; h: number }
) => {
  if (!size || !size.w || !size.h) return box;
  const k = Math.min(box.w / size.w, box.h / size.h);
  const w = size.w * k;
  const h = size.h * k;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
};

const kalImageSize = (buf: ArrayBuffer): Promise<{ w: number; h: number } | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([buf]));
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

export interface KalibrasiExportOptions {
  fileName?: string;
  nomorDokumen?: string;
  revisi?: string | number;
  tanggalDokumen?: Date;
  logoPlnUrl?: string;
  logoK3Url?: string;
  // blok tanda tangan: kiri "Disetujui," | kanan "Disusun Oleh," (kosong = titik-titik)
  kota?: string;
  tanggalCetak?: Date;
  jabatan?: string; // jabatan pembuat (blok kanan, "Disusun Oleh,")
  nama?: string; // nama pembuat
  disetujuiNama?: string; // blok kiri ("Disetujui,")
  disetujuiJabatan?: string;
  kopLines?: { text: string; bold?: boolean }[]; // teks kop di kotak tengah atas
}

const kalPick = (item: unknown, keys: string[]): unknown => {
  for (const k of keys) {
    const v = (item as Record<string, unknown>)[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
};

// Date dibuat UTC agar tidak bergeser sehari oleh zona waktu (WIB = UTC+7)
const kalToDate = (v: unknown): Date | null => {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
  }
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  return null;
};

const kalBulanTahun = (d: Date) => `${BULAN_ID[d.getUTCMonth()]}-${String(d.getUTCFullYear()).slice(-2)}`;

const kalTanggalPanjang = (d: Date) => `${String(d.getDate()).padStart(2, "0")} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;

// teks kolom Kalibrasi / Rencana: tanggal -> "November-25", kosong -> "-"
const kalBulanTxt = (v: unknown): string => {
  const d = kalToDate(v);
  return d ? kalBulanTahun(d) : v === undefined || v === null ? "-" : String(v);
};

// Pakai field "kategori" bila ada; jika kosong tebak dari huruf ke-2 kode alat
// (3MMC001 -> Mekanik/G | 3EBA003 -> Elektrik/H | 3SSY008 -> Sipil/I)
const kalKolomBidang = (item: AlatUkur): 7 | 8 | 9 => {
  const kat = String(item.kategori ?? "").trim().toLowerCase();
  if (kat === "elektrik") return 8;
  if (kat === "sipil") return 9;
  if (kat === "mekanik") return 7;
  const c = String(item.kode_alat ?? "").trim().toUpperCase().charAt(1);
  return c === "E" ? 8 : c === "S" ? 9 : 7;
};

const kalKondisiOf = (it: AlatUkur) => String(it.kondisi ?? "").trim().toUpperCase();

const kalHitung = (items: AlatUkur[], col: 7 | 8 | 9, kond?: string) =>
  items.filter((it) => {
    const kode = String(it.kode_alat ?? "").trim();
    return kode && kalKolomBidang(it) === col && (!kond || kalKondisiOf(it) === kond);
  }).length;

const KAL_REKAP: [string, string | undefined][] = [
  ["JUMLAH ALAT UKUR", undefined],
  ['ALAT UKUR "BAIK"', "BAIK"],
  ['ALAT UKUR "RPP"', "RPP"],
  ['ALAT UKUR "RT"', "RT"],
];

const kalLoadImage = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const r = await fetch(url);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
};

const kalToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// Font standar jsPDF hanya mengenal WinAnsi. Karakter di luar itu (µ Yunani,
// ℃, dsb) membuat teks jadi renggang / hilang -> samakan dulu.
const pdfSafe = (s: string): string =>
  s
    .replace(/\u03BC/g, "\u00B5") // μ (Yunani) -> µ
    .replace(/\u2103/g, "\u00B0C") // ℃ -> °C
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2033/g, '"') // ″ (inci) -> "
    .replace(/\u2032/g, "'")
    .replace(/\u00A0/g, " ")
    .replace(/[^\n\u0020-\u007E\u00A1-\u00FF]/g, "");

const kalNama = (n: string) => (n.trim() ? `(${n.trim()})` : "( ................................ )");

const kalKeterangan = (item: AlatUkur) => kalPick(item, KAL_FIELD_KEYS.keterangan);

// =====================================================================
// EXCEL
// =====================================================================
export async function exportKalibrasiExcel(items: AlatUkur[], opts: KalibrasiExportOptions = {}) {
  const ExcelJS = (await import("exceljs")).default;

  const {
    fileName = "Daftar-Alat-Ukur-dan-Status-Kalibrasi",
    nomorDokumen = "FR.01-PT.06.PNW",
    revisi = 3,
    tanggalDokumen = new Date(Date.UTC(2022, 1, 15)),
    logoPlnUrl = "/images/laporan/logo-pln.jpeg",
    logoK3Url = "/images/laporan/logo-k3.jpeg",
    kota = "",
    tanggalCetak,
    jabatan = "",
    nama = "",
    disetujuiNama = "",
    disetujuiJabatan = "",
    kopLines = KAL_KOP_LINES,
  } = opts;

  const thin = { style: "thin" } as const;
  const med = { style: "medium" } as const;
  const hair = { style: "hair" } as const;
  const allThin = { top: thin, left: thin, bottom: thin, right: thin };

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Kalibrasi", {
    properties: { defaultRowHeight: ROW_BASE },
    views: [{ showGridLines: false, zoomScale: 85 }],
  });
  KAL_COL_WIDTHS.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  // ---------- helpers ----------
  const merge = (r1: number, c1: number, r2: number, c2: number) => {
    if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2);
  };
  // garis tepi hanya di sisi luar rentang
  const outline = (
    r1: number, c1: number, r2: number, c2: number,
    s: { top?: any; left?: any; bottom?: any; right?: any }
  ) => {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const cell = ws.getCell(r, c);
        cell.border = {
          ...cell.border,
          ...(r === r1 && s.top ? { top: s.top } : {}),
          ...(r === r2 && s.bottom ? { bottom: s.bottom } : {}),
          ...(c === c1 && s.left ? { left: s.left } : {}),
          ...(c === c2 && s.right ? { right: s.right } : {}),
        };
      }
    }
  };
  const put = (
    r1: number, c1: number, r2: number, c2: number,
    value: any,
    style: { font?: any; align?: any; numFmt?: string; border?: any } = {}
  ) => {
    merge(r1, c1, r2, c2);
    const cell = ws.getCell(r1, c1);
    if (value !== undefined) cell.value = value;
    if (style.font) cell.font = style.font;
    if (style.align) cell.alignment = style.align;
    if (style.numFmt) cell.numFmt = style.numFmt;
    if (style.border) outline(r1, c1, r2, c2, style.border);
  };

  const tahoma = (sz: number, bold = false) => ({ name: "Tahoma", size: sz, bold });
  const calibri = (bold = false, italic = false, underline = false) => ({ name: "Calibri", size: 11, bold, italic, underline });
  const center = { horizontal: "center", vertical: "middle", wrapText: true } as const;

  // ---------- tinggi baris kop & header (persis template) ----------
  HEAD_ROWS_PT.forEach((h, i) => (ws.getRow(i + 1).height = h));

  // ---------- KOP (baris 1-5) ----------
  put(1, 1, 5, 2, undefined, { border: { top: thin, left: thin, bottom: med, right: med } }); // logo PLN
  const kopValue = {
    richText: kopLines.map((l, i) => ({
      text: l.text + (i < kopLines.length - 1 ? "\n" : ""),
      font: { name: "Tahoma", size: 9, bold: !!l.bold },
    })),
  };
  put(1, 3, 5, 14, kopValue, {
    font: tahoma(9, false),
    align: { horizontal: "left", vertical: "middle", wrapText: true, indent: 2 },
    border: { top: thin, left: med, bottom: med },
  });
  put(1, 15, 5, 15, undefined, { border: { top: thin, bottom: med, right: thin } }); // logo K3

  // ---------- JUDUL + KOTAK INFO DOKUMEN (baris 6-9) ----------
  put(6, 1, 9, 12, "DAFTAR ALAT UKUR DAN STATUS KALIBRASI", {
    font: tahoma(12, true),
    align: center,
    border: { top: med, left: thin, right: thin, bottom: thin },
  });
  const info: [string, any, string?][] = [
    ["Nomor", nomorDokumen],
    ["Revisi ", revisi],
    ["Tanggal", tanggalDokumen, "d-mmm-yy"],
    ["Halaman", "1 dari 1 halaman"],
  ];
  info.forEach(([label, val, fmt], i) => {
    const r = 6 + i;
    const al = { horizontal: "left", vertical: "middle", wrapText: true } as const;
    const aj = { horizontal: "justify", vertical: "middle", wrapText: true } as const;
    put(r, 13, r, 13, label, { font: tahoma(8), align: al });
    put(r, 14, r, 14, ":", { font: tahoma(8), align: aj });
    put(r, 15, r, 15, val, { font: tahoma(8), align: aj, numFmt: fmt });
  });
  outline(6, 13, 9, 15, { bottom: med, right: thin });

  // ---------- HEADER TABEL (baris 11-12) ----------
  const H = { font: calibri(true), align: center, border: allThin };
  put(11, 1, 12, 1, "No", H);
  put(11, 2, 12, 3, "Nama Alat Ukur", H);
  put(11, 4, 11, 6, "Merk & Spesifikasi", H);
  put(12, 4, 12, 4, "Merk", H);
  put(12, 5, 12, 5, "SN ", H);
  put(12, 6, 12, 6, "Spesifikasi", H);
  put(11, 7, 11, 9, "Kode Nomor Alat Ukur", H);
  put(12, 7, 12, 7, "Mekanik", H);
  put(12, 8, 12, 8, "Elektrik", H);
  put(12, 9, 12, 9, "Sipil", H);
  // "Kalibrasi" & "Kondisi Alat Ukur": dua sel tanpa garis pemisah di antaranya
  const top2 = { horizontal: "center", vertical: "bottom" } as const;
  const bot2 = { horizontal: "center", vertical: "top" } as const;
  put(11, 10, 11, 10, " Kalibrasi", { font: calibri(true), align: top2, border: { top: thin, left: thin, right: thin } });
  put(12, 10, 12, 10, "( Bulan - Tahun)", { font: calibri(true), align: bot2, border: { left: thin, right: thin, bottom: thin } });
  put(11, 11, 12, 11, "Rencana Kalibrasi Berikutnya\n( Bulan - Tahun)", H);
  put(11, 12, 11, 12, "Kondisi Alat Ukur", { font: calibri(true), align: top2, border: { top: thin, left: thin, right: thin } });
  put(12, 12, 12, 12, "(Baik/RPP*/RT**)", { font: calibri(true), align: bot2, border: { left: thin, right: thin, bottom: thin } });
  put(11, 13, 12, 15, "Keterangan", H);

  // baris 13 (baris kosong pemisah): garis tegak + garis hair di bawah
  const GROUPS: [number, number][] = [[1, 1], [2, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 9], [10, 10], [11, 11], [12, 12], [13, 15]];
  GROUPS.forEach(([c1, c2]) => {
    merge(13, c1, 13, c2);
    outline(13, c1, 13, c2, { top: thin, left: thin, right: thin, bottom: hair });
  });

  // ---------- DATA (mulai baris 14) ----------
  const FIRST = 14;
  const lineH = (text: unknown, width: number) =>
    Math.max(1, Math.ceil(String(text ?? "").length / (width * 0.95)));

  items.forEach((item, i) => {
    const r = FIRST + i;
    const kode = String(item.kode_alat ?? "").trim();
    const tglKal = kalPick(item, KAL_FIELD_KEYS.kalibrasi);
    const rencana = kalPick(item, KAL_FIELD_KEYS.rencana);
    const spesifikasi = kalPick(item, KAL_FIELD_KEYS.spesifikasi);
    const ket = kalKeterangan(item);
    const body = { font: calibri(), border: allThin };
    const mid = { horizontal: "center", vertical: "middle", wrapText: true } as const;
    const bottom = { horizontal: "center" } as const; // seperti template: rata bawah

    put(r, 1, r, 1, i + 1, { ...body, align: bottom });
    put(r, 2, r, 3, item.nama_alat ?? "", {
      ...body,
      align: { horizontal: "left", vertical: "middle", wrapText: true },
    });
    put(r, 4, r, 4, item.merk ?? undefined, { ...body, align: mid });
    put(r, 5, r, 5, item.sn ? String(item.sn) : undefined, { ...body, align: mid, numFmt: "@" });
    put(r, 6, r, 6, spesifikasi as any, { ...body, align: mid });
    for (const c of [7, 8, 9]) put(r, c, r, c, undefined, { ...body, align: mid });
    if (kode) ws.getCell(r, kalKolomBidang(item)).value = kode;
    put(r, 10, r, 10, kalBulanTxt(tglKal), { ...body, align: bottom });
    put(r, 11, r, 11, kalBulanTxt(rencana), { ...body, align: bottom });
    put(r, 12, r, 12, item.kondisi ?? undefined, { ...body, align: bottom });
    put(r, 13, r, 15, ket as any, { ...body, align: mid });

    const lines = Math.max(
      lineH(item.nama_alat, 36.5),
      lineH(item.merk, 25.3),
      lineH(item.sn, 18.5),
      lineH(spesifikasi, 22.7),
      lineH(ket, 30.6)
    );
    if (lines > 1) ws.getRow(r).height = ROW_BASE * lines;
  });

  const lastData = FIRST + items.length - 1;

  // ---------- REKAP (4 baris) ----------
  const S = lastData + 1;
  const rng = (col: string) => `${col}${FIRST}:${col}${lastData}`;
  KAL_REKAP.forEach(([label, kond], i) => {
    const r = S + i;
    put(r, 1, r, 6, label, {
      font: calibri(),
      align: { horizontal: "right", vertical: "middle" },
      border: allThin,
    });
    ([7, 8, 9] as const).forEach((c) => {
      const L = String.fromCharCode(64 + c);
      const formula = !items.length
        ? undefined
        : kond
        ? `COUNTIFS(${rng(L)},"<>",${rng("L")},"${kond === "BAIK" ? "Baik" : kond}")`
        : `COUNTA(${rng(L)})`;
      put(r, c, r, c, formula ? { formula, result: kalHitung(items, c, kond) } : 0, {
        font: calibri(),
        align: { horizontal: "center", vertical: "middle" },
        border: allThin,
      });
    });
    // kotak kosong di kanan rekap: baris pertama 4 kotak (J, K, L, M:O), sisanya J:O
    if (i === 0) {
      put(r, 10, r, 10, undefined, { font: calibri(), border: allThin });
      put(r, 11, r, 11, undefined, { font: calibri(), border: allThin });
      put(r, 12, r, 12, undefined, { font: calibri(), border: allThin });
      put(r, 13, r, 15, undefined, { font: calibri(), border: allThin });
    } else {
      put(r, 10, r, 15, undefined, { font: calibri(), border: allThin });
    }
  });

  // ---------- KETERANGAN ----------
  put(S + 5, 1, S + 5, 1, "Keterangan :", { font: calibri(true) });
  put(S + 6, 1, S + 6, 1, "1. RPP  = Rusak/ Perlu Perbaikan", { font: calibri(true, true) });
  put(S + 7, 1, S + 7, 1, "2. RT    = Rusak Total", { font: calibri(true, true) });

  // ---------- TANDA TANGAN (6 baris terakhir) ----------
  // kiri (kolom I)  : Disetujui, / nama / jabatan
  // kanan (K:O)     : tempat+tanggal / Disusun Oleh, / 2 baris kosong / nama / jabatan
  const sigC = { horizontal: "center", vertical: "middle" } as const;
  const sigT = { horizontal: "center", vertical: "top" } as const;
  const tempatTgl = `${kota || "..............."}, ${kalTanggalPanjang(tanggalCetak ?? new Date())}`;
  put(S + 8, 9, S + 8, 9, "Disetujui,", { font: calibri(), align: sigC });
  put(S + 12, 9, S + 12, 9, kalNama(disetujuiNama), { font: calibri(), align: sigC });
  put(S + 13, 9, S + 13, 9, disetujuiJabatan || "Jabatan", { font: calibri(), align: sigT });
  put(S + 8, 11, S + 8, 15, tempatTgl, { font: calibri(), align: sigC });
  put(S + 9, 11, S + 9, 15, "Disusun Oleh,", { font: calibri(), align: sigC });
  put(S + 12, 11, S + 12, 15, kalNama(nama), { font: calibri(), align: sigC });
  put(S + 13, 11, S + 13, 15, jabatan || "Jabatan", { font: calibri(), align: sigT });
  const LAST = S + 13;

  // ---------- BINGKAI LUAR ----------
  for (let r = 6; r <= LAST; r++) {
    outline(r, 1, r, 1, { left: thin });
    outline(r, KAL_LAST_COL, r, KAL_LAST_COL, { right: thin });
  }
  outline(LAST, 1, LAST, KAL_LAST_COL, { bottom: thin });

  // ---------- LOGO (proporsi asli dipertahankan) ----------
  const colPx = KAL_COL_WIDTHS.map(kalPx);
  const rowPx = HEAD_ROWS_PT.map((p) => p / 0.75);
  const anchorAt = (x: number, y: number) => {
    let c = 0;
    let cx = x;
    while (c < colPx.length - 1 && cx >= colPx[c]) {
      cx -= colPx[c];
      c++;
    }
    let r = 0;
    let ry = y;
    while (r < rowPx.length - 1 && ry >= rowPx[r]) {
      ry -= rowPx[r];
      r++;
    }
    return { nativeCol: c, nativeColOff: Math.round(cx * 9525), nativeRow: r, nativeRowOff: Math.round(ry * 9525) };
  };
  const addLogo = async (buf: ArrayBuffer | null, box: { x: number; y: number; w: number; h: number }) => {
    if (!buf) return;
    const f = kalContain(await kalImageSize(buf), box);
    const id = wb.addImage({ buffer: buf as any, extension: "jpeg" });
    ws.addImage(id, {
      tl: anchorAt(f.x, f.y),
      ext: { width: f.w, height: f.h },
      editAs: "oneCell",
    } as any);
  };
  const [plnBuf, k3Buf] = await Promise.all([kalLoadImage(logoPlnUrl), kalLoadImage(logoK3Url)]);
  await addLogo(plnBuf, KAL_LOGO_PLN);
  await addLogo(k3Buf, KAL_LOGO_K3);

  // ---------- PENGATURAN CETAK ----------
  ws.pageSetup = {
    orientation: "landscape",
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    printArea: `A1:O${LAST}`,
    printTitlesRow: "1:12",
    margins: { left: 0.3937, right: 0.3937, top: 0.4331, bottom: 0.748, header: 0.315, footer: 0.315 },
  };

  // ---------- DOWNLOAD ----------
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =====================================================================
// PDF
// Digambar sel demi sel memakai ukuran asli Excel (lebar kolom -> px,
// tinggi baris -> pt), lalu diskalakan agar lebar tabel = lebar kertas
// A4 landscape (sama seperti "Fit all columns on one page").
// =====================================================================
export function renderKalibrasiPdf(
  doc: any,
  items: AlatUkur[],
  opts: KalibrasiExportOptions,
  plnImg: string | null,
  k3Img: string | null
) {
  const {
    nomorDokumen = "FR.01-PT.06.PNW",
    revisi = 3,
    tanggalDokumen = new Date(Date.UTC(2022, 1, 15)),
    kota = "",
    tanggalCetak,
    jabatan = "",
    nama = "",
    disetujuiNama = "",
    disetujuiJabatan = "",
    kopLines = KAL_KOP_LINES,
  } = opts;

  // ---------- geometri ----------
  const PAGE_W = 297;
  const PAGE_H = 210;
  const ML = 10; // margin kiri/kanan 0,3937" ~ 10 mm
  const MT = 11; // margin atas 0,433"
  const MB = 19; // margin bawah 0,748"
  const LIMIT = PAGE_H - MB;

  const COL_PX = KAL_COL_WIDTHS.map((w) => Math.round(w * 7 + 5)); // lebar kolom Excel dalam px
  const totalPx = COL_PX.reduce((a, b) => a + b, 0);
  const mmPx = (PAGE_W - 2 * ML) / totalPx; // mm per px
  const mmPt = mmPx / 0.75; // mm per pt (pt Excel)
  const fsK = (mmPt * 72) / 25.4; // skala font (pt Excel -> pt PDF) ~0,57
  const FONT_K = 0.88; // Helvetica sedikit lebih lebar dari Calibri
  const colX: number[] = [ML];
  COL_PX.forEach((p) => colX.push(colX[colX.length - 1] + p * mmPx));
  const emuToMm = (emu: number) => (emu / 9525) * mmPx;

  const LW = { thin: 0.12, med: 0.32, hair: 0.05 } as const;
  type W = keyof typeof LW;
  const lh = ROW_BASE * mmPt; // tinggi satu baris teks

  doc.setDrawColor(0);
  doc.setTextColor(0);

  // ---------- primitif gambar ----------
  const ln = (x1: number, y1: number, x2: number, y2: number, w: W) => {
    doc.setLineWidth(LW[w]);
    doc.line(x1, y1, x2, y2);
  };
  const box = (c1: number, c2: number, y1: number, y2: number, b: { l?: W; t?: W; r?: W; b?: W }) => {
    const x1 = colX[c1];
    const x2 = colX[c2];
    if (b.t) ln(x1, y1, x2, y1, b.t);
    if (b.b) ln(x1, y2, x2, y2, b.b);
    if (b.l) ln(x1, y1, x1, y2, b.l);
    if (b.r) ln(x2, y1, x2, y2, b.r);
  };

  type Style = "normal" | "bold" | "italic" | "bolditalic";
  const setFont = (style: Style, pt: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(pt * fsK * FONT_K);
  };

  const wrapLines = (s: string, style: Style, pt: number, maxW: number): string[] => {
    setFont(style, pt);
    return pdfSafe(s)
      .split("\n")
      .flatMap((p) => (p === "" ? [""] : (doc.splitTextToSize(p, maxW) as string[])));
  };

  interface TOpt {
    pt?: number;
    style?: Style;
    h?: "left" | "center" | "right";
    v?: "top" | "middle" | "bottom";
    wrap?: boolean;
    shrink?: boolean;
    underline?: boolean;
  }
  const PAD = 0.5;
  const text = (value: unknown, c1: number, c2: number, y1: number, y2: number, o: TOpt = {}) => {
    if (value === undefined || value === null || String(value) === "") return;
    const style = o.style ?? "normal";
    let pt = o.pt ?? 11;
    const x1 = colX[c1];
    const x2 = colX[c2];
    const maxW = x2 - x1 - 2 * PAD;
    const wrap = o.wrap !== false;
    let lines = wrapLines(String(value), style, pt, maxW);

    if (!wrap || o.shrink) {
      // satu baris: kecilkan font bila melebihi lebar sel
      lines = pdfSafe(String(value)).split("\n");
      if (o.shrink) {
        let guard = 0;
        setFont(style, pt);
        while (guard++ < 12 && Math.max(...lines.map((l) => doc.getTextWidth(l))) > maxW) {
          pt *= 0.94;
          setFont(style, pt);
        }
      }
    }
    setFont(style, pt);
    const sizeMm = (pt * fsK * FONT_K * 25.4) / 72;
    const block = lines.length * lh;
    const h = o.h ?? "left";
    const v = o.v ?? "middle";
    const yStart = v === "top" ? y1 + 0.2 : v === "bottom" ? y2 - block - 0.2 : y1 + (y2 - y1 - block) / 2;
    const x = h === "left" ? x1 + PAD : h === "right" ? x2 - PAD : (x1 + x2) / 2;
    lines.forEach((l, i) => {
      const y = yStart + i * lh + lh / 2 + sizeMm * 0.32;
      doc.text(l, x, y, { align: h });
      if (o.underline) {
        const tw = doc.getTextWidth(l);
        const ux = h === "center" ? x - tw / 2 : h === "right" ? x - tw : x;
        ln(ux, y + 0.4, ux + tw, y + 0.4, "thin");
      }
    });
  };

  // ---------- HEADER (baris 1-12, diulang tiap halaman) ----------
  const hh = HEAD_ROWS_PT.map((p) => p * mmPt);
  const ry: number[] = [];
  {
    let a = MT;
    hh.forEach((h) => {
      ry.push(a);
      a += h;
    });
    ry.push(a);
  }
  // ry[i] = sisi atas baris ke-(i+1); ry[12] = sisi bawah baris 12
  const yHeadBottom = ry[12];
  const frameTop = ry[5]; // bingkai luar mulai dari baris 6

  const tglDok = `${tanggalDokumen.getUTCDate()}-${BULAN_ID[tanggalDokumen.getUTCMonth()].slice(0, 3)}-${String(
    tanggalDokumen.getUTCFullYear()
  ).slice(-2)}`;

  const drawHeader = () => {
    // kop: kotak logo PLN | kotak tengah | kotak logo K3
    box(0, 2, ry[0], ry[5], { l: "thin", t: "thin", r: "med", b: "med" });
    box(2, 14, ry[0], ry[5], { t: "thin", l: "med", b: "med" });
    box(14, 15, ry[0], ry[5], { t: "thin", r: "thin", b: "med" });

    // teks kop (blok 5 baris, rata kiri, dipusatkan vertikal di kotak tengah)
    {
      const kopLh = 12.9 * mmPt;
      const y0 = ry[0] + (ry[5] - ry[0] - kopLines.length * kopLh) / 2;
      const sizeMm = (9 * fsK * FONT_K * 25.4) / 72;
      kopLines.forEach((l, i) => {
        setFont(l.bold ? "bold" : "normal", 9);
        doc.text(pdfSafe(l.text), colX[2] + 45 * mmPx, y0 + i * kopLh + kopLh / 2 + sizeMm * 0.32);
      });
    }

    // logo: proporsi asli dipertahankan, dipusatkan di kotaknya
    const putLogo = (img: string | null, box: { x: number; y: number; w: number; h: number }) => {
      if (!img) return;
      let size: { w: number; h: number } | null = null;
      try {
        const p = doc.getImageProperties(img);
        size = { w: p.width, h: p.height };
      } catch {
        size = null;
      }
      const f = kalContain(size, box);
      doc.addImage(img, "JPEG", colX[0] + f.x * mmPx, ry[0] + f.y * mmPx, f.w * mmPx, f.h * mmPx);
    };
    putLogo(plnImg, KAL_LOGO_PLN);
    putLogo(k3Img, KAL_LOGO_K3);

    // judul + kotak info dokumen
    box(0, 12, ry[5], ry[9], { t: "med", l: "thin", r: "thin", b: "thin" });
    text("DAFTAR ALAT UKUR DAN STATUS KALIBRASI", 0, 12, ry[5], ry[9], { pt: 12, style: "bold", h: "center" });
    box(12, 15, ry[5], ry[9], { r: "thin", b: "med" });
    const info: [string, string][] = [
      ["Nomor", String(nomorDokumen)],
      ["Revisi", String(revisi)],
      ["Tanggal", tglDok],
      ["Halaman", "1 dari 1 halaman"],
    ];
    info.forEach(([l, v], i) => {
      const y1 = ry[5 + i];
      const y2 = ry[6 + i];
      text(l, 12, 13, y1, y2, { pt: 8, wrap: false });
      text(":", 13, 14, y1, y2, { pt: 8, wrap: false });
      text(v, 14, 15, y1, y2, { pt: 8, wrap: false, shrink: true });
    });

    // header tabel (baris 11-12)
    const y11 = ry[10];
    const y12 = ry[11];
    const y13 = ry[12];
    const all: { l: W; t: W; r: W; b: W } = { l: "thin", t: "thin", r: "thin", b: "thin" };
    const HB = { pt: 11, style: "bold" as Style, h: "center" as const, shrink: true, wrap: false };
    box(0, 1, y11, y13, all);
    text("No", 0, 1, y11, y13, HB);
    box(1, 3, y11, y13, all);
    text("Nama Alat Ukur", 1, 3, y11, y13, HB);
    box(3, 6, y11, y12, all);
    text("Merk & Spesifikasi", 3, 6, y11, y12, HB);
    (["Merk", "SN", "Spesifikasi"] as const).forEach((t, i) => {
      box(3 + i, 4 + i, y12, y13, all);
      text(t, 3 + i, 4 + i, y12, y13, HB);
    });
    box(6, 9, y11, y12, all);
    text("Kode Nomor Alat Ukur", 6, 9, y11, y12, HB);
    (["Mekanik", "Elektrik", "Sipil"] as const).forEach((t, i) => {
      box(6 + i, 7 + i, y12, y13, all);
      text(t, 6 + i, 7 + i, y12, y13, HB);
    });
    // Kalibrasi & Kondisi: dua sel menyatu tanpa garis pemisah
    box(9, 10, y11, y12, { l: "thin", t: "thin", r: "thin" });
    text("Kalibrasi", 9, 10, y11, y12, { ...HB, v: "bottom" });
    box(9, 10, y12, y13, { l: "thin", r: "thin", b: "thin" });
    text("( Bulan - Tahun)", 9, 10, y12, y13, { ...HB, v: "top" });
    box(10, 11, y11, y13, all);
    text("Rencana Kalibrasi\nBerikutnya\n( Bulan - Tahun)", 10, 11, y11, y13, { pt: 11, style: "bold", h: "center", wrap: false, shrink: true });
    box(11, 12, y11, y12, { l: "thin", t: "thin", r: "thin" });
    text("Kondisi Alat Ukur", 11, 12, y11, y12, { ...HB, v: "bottom" });
    box(11, 12, y12, y13, { l: "thin", r: "thin", b: "thin" });
    text("(Baik/RPP*/RT**)", 11, 12, y12, y13, { ...HB, v: "top" });
    box(12, 15, y11, y13, all);
    text("Keterangan", 12, 15, y11, y13, HB);
  };

  // ---------- baris tabel + paginasi ----------
  let y = yHeadBottom;

  const closeFrame = () => {
    ln(colX[0], frameTop, colX[0], y, "thin");
    ln(colX[15], frameTop, colX[15], y, "thin");
  };
  const newPage = () => {
    closeFrame();
    doc.addPage();
    doc.setDrawColor(0);
    doc.setTextColor(0);
    drawHeader();
    y = yHeadBottom;
  };

  interface Cell {
    c1: number;
    c2: number;
    value?: unknown;
    o?: TOpt;
  }
  const VERT_DATA = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15];

  // tinggi baris butuh berapa pt (min ROW_BASE), dihitung dari teks yang di-wrap
  const rowHeight = (cells: Cell[]): number => {
    let lines = 1;
    cells.forEach((c) => {
      if (c.value === undefined || c.value === null || String(c.value) === "") return;
      if (c.o?.wrap === false) return;
      const maxW = colX[c.c2] - colX[c.c1] - 2 * PAD;
      lines = Math.max(lines, wrapLines(String(c.value), c.o?.style ?? "normal", c.o?.pt ?? 11, maxW).length);
    });
    return lines * lh;
  };

  const drawRow = (
    h: number,
    cells: Cell[],
    verts: number[],
    bottom: W | null,
    leftover: () => void = () => {}
  ) => {
    if (y + h > LIMIT) newPage();
    verts.forEach((c) => ln(colX[c], y, colX[c], y + h, "thin"));
    if (bottom) ln(colX[0], y + h, colX[15], y + h, bottom);
    cells.forEach((c) => text(c.value, c.c1, c.c2, y, y + h, c.o));
    leftover();
    y += h;
  };

  // ---- halaman pertama ----
  drawHeader();

  // baris 13: baris kosong pemisah (hanya di halaman pertama, seperti template)
  drawRow(lh, [], VERT_DATA, "hair");

  // ---- data ----
  const MID: TOpt = { h: "center", v: "middle" };
  const BOT: TOpt = { h: "center", v: "bottom" };
  items.forEach((item, i) => {
    const kode = String(item.kode_alat ?? "").trim();
    const kol = kode ? kalKolomBidang(item) : 0;
    const cells: Cell[] = [
      { c1: 0, c2: 1, value: i + 1, o: BOT },
      { c1: 1, c2: 3, value: item.nama_alat ?? "", o: { h: "left", v: "middle" } },
      { c1: 3, c2: 4, value: item.merk ?? "", o: MID },
      { c1: 4, c2: 5, value: item.sn ?? "", o: MID },
      { c1: 5, c2: 6, value: kalPick(item, KAL_FIELD_KEYS.spesifikasi) ?? "", o: MID },
      { c1: 6, c2: 7, value: kol === 7 ? kode : "", o: MID },
      { c1: 7, c2: 8, value: kol === 8 ? kode : "", o: MID },
      { c1: 8, c2: 9, value: kol === 9 ? kode : "", o: MID },
      { c1: 9, c2: 10, value: kalBulanTxt(kalPick(item, KAL_FIELD_KEYS.kalibrasi)), o: BOT },
      { c1: 10, c2: 11, value: kalBulanTxt(kalPick(item, KAL_FIELD_KEYS.rencana)), o: BOT },
      { c1: 11, c2: 12, value: item.kondisi ?? "", o: BOT },
      { c1: 12, c2: 15, value: kalKeterangan(item) ?? "", o: MID },
    ];
    drawRow(rowHeight(cells), cells, VERT_DATA, "thin");
  });

  // ---- rekap (4 baris) ----
  KAL_REKAP.forEach(([label, kond], i) => {
    const cells: Cell[] = [
      { c1: 0, c2: 6, value: label, o: { h: "right", v: "middle", wrap: false } },
      { c1: 6, c2: 7, value: kalHitung(items, 7, kond), o: MID },
      { c1: 7, c2: 8, value: kalHitung(items, 8, kond), o: MID },
      { c1: 8, c2: 9, value: kalHitung(items, 9, kond), o: MID },
    ];
    // baris pertama: kotak kanan terpisah (J, K, L, M:O); sisanya satu kotak J:O
    const verts = i === 0 ? [0, 6, 7, 8, 9, 10, 11, 12, 15] : [0, 6, 7, 8, 9, 15];
    drawRow(lh, cells, verts, "thin");
  });

  // ---- keterangan + tanda tangan (10 baris: S+4 .. S+13) ----
  const NW = { wrap: false } as const;
  const left = (value: string, style: Style): Cell => ({ c1: 0, c2: 6, value, o: { style, ...NW } });
  const sig = (value: string, o: TOpt = {}): Cell => ({ c1: 10, c2: 15, value, o: { h: "center", ...NW, ...o } });
  const sigL = (value: string, o: TOpt = {}): Cell => ({ c1: 8, c2: 9, value, o: { h: "center", ...NW, ...o } });
  const tempatTgl = `${kota || "..............."}, ${kalTanggalPanjang(tanggalCetak ?? new Date())}`;
  const footer: { cells: Cell[]; bottom?: W }[] = [
    { cells: [] }, // S+4 kosong
    { cells: [left("Keterangan :", "bold")] }, // S+5
    { cells: [left("1. RPP  = Rusak/ Perlu Perbaikan", "bolditalic")] }, // S+6
    { cells: [left("2. RT    = Rusak Total", "bolditalic")] }, // S+7
    { cells: [sigL("Disetujui,"), sig(tempatTgl)] }, // S+8
    { cells: [sig("Disusun Oleh,")] }, // S+9
    { cells: [] }, // S+10 (ruang tanda tangan)
    { cells: [] }, // S+11
    { cells: [sigL(kalNama(disetujuiNama)), sig(kalNama(nama))] }, // S+12
    { cells: [sigL(disetujuiJabatan || "Jabatan", { v: "top" }), sig(jabatan || "Jabatan", { v: "top" })], bottom: "thin" }, // S+13
  ];
  footer.forEach((row) => drawRow(lh, row.cells, [], row.bottom ?? null));

  closeFrame();
}

export async function exportKalibrasiPDF(items: AlatUkur[], opts: KalibrasiExportOptions = {}) {
  const { jsPDF } = await import("jspdf");
  const {
    fileName = "Daftar-Alat-Ukur-dan-Status-Kalibrasi",
    logoPlnUrl = "/images/laporan/logo-pln.jpeg",
    logoK3Url = "/images/laporan/logo-k3.jpeg",
  } = opts;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const [plnImg, k3Img] = await Promise.all([kalToDataUrl(logoPlnUrl), kalToDataUrl(logoK3Url)]);

  renderKalibrasiPdf(doc, items, opts, plnImg, k3Img);
  doc.save(`${fileName}.pdf`);
}

// Dipakai tombol PDF & Excel. Blok TTD selalu tampil; bagian yang tidak diisi
// berupa titik-titik untuk ditulis tangan.
export const KAL_DOC_OPTIONS: KalibrasiExportOptions = {
  fileName: "Daftar-Alat-Ukur-dan-Status-Kalibrasi",
  kota: "Bandung",
  // tanggalCetak: new Date(2026, 7, 3), // kosongkan = tanggal hari ini
  nama: "BAGUS SANJAYA PUTRA", // Disusun Oleh
  jabatan: "TL Quality Control",
  disetujuiNama: "MUCHTAR BUCHORI", // Disetujui
  disetujuiJabatan: "Asman Produksi",
};