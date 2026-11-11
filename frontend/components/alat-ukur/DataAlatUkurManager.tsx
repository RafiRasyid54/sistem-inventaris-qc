"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form,
  Modal,
} from "react-bootstrap";

import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconId,
  IconUserCheck,
  IconUserQuestion,
  IconLogout,
  IconAlertTriangle,
  IconScan,
  IconBuildingStore,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconQrcode,
  IconCamera,
} from "@tabler/icons-react";

import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";

import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";

import { ColumnDefinition } from "./ColumnDefination";
import { AlatUkurDetailModal } from "./AlatUkurDetailModal";
import { AlatUkurFormModal } from "./AlatUkurFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import LoanFormModal from "components/common/LoanFormModal";
import WebCameraScannerModal from "components/common/WebCameraScannerModal";
import { CartFAB } from "./CartFAB";

import apiFetch from "/lib/apiFetch";
import { AlatUkur } from "../../types/DataAlatUkurTypes";
import { prosesPeminjamanApi } from "services/peminjamanService";

interface AlatUkurApiResponse {
  status: string;
  data: AlatUkur[];
}

const namaPeminjam = (p: any): string =>
  p?.nama ||
  p?.nama_peminta ||
  p?.name ||
  p?.username ||
  p?.nama_lengkap ||
  p?.instansi_vendor ||
  "Pengguna";

// ---------- Helper status alat ----------
const isDipinjam = (item: AlatUkur): boolean => {
  const s = String((item as any).status_peminjaman ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return s === "dipinjam" || s === "sedangdipinjam";
};

const isRusak = (item: AlatUkur): boolean => {
  const k = String(item.kondisi ?? "").trim().toUpperCase();
  return k === "RPP" || k === "RT";
};

// ---------- Warna tema PLN ----------
const NAVY = "#06355f";
const BLUE = "#0b6bb8";
const YELLOW = "#ffc20e";
const LINE = "#dbe5f1";
const MUTE = "#62708a";
const GREEN = "#12a36b";

// ---------- Style inline ----------
const alertStyle: React.CSSProperties = { border: 0, borderRadius: 12 };

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: BLUE,
  borderColor: BLUE,
};

const yellowBtnStyle: React.CSSProperties = {
  backgroundColor: YELLOW,
  border: 0,
  color: NAVY,
  fontWeight: 700,
};

const stepPillStyle = (state: "now" | "done" | "todo"): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: ".8rem",
  padding: "5px 12px 5px 6px",
  borderRadius: 99,
  background: state === "now" ? NAVY : "#eef3f9",
  color: state === "now" ? "#fff" : MUTE,
  fontWeight: state === "now" ? 600 : 400,
});

const stepNumStyle = (state: "now" | "done" | "todo"): React.CSSProperties => ({
  width: 20,
  height: 20,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  fontSize: ".7rem",
  fontWeight: 800,
  fontStyle: "normal",
  background: state === "now" ? YELLOW : state === "done" ? GREEN : "#cfdbea",
  color: state === "done" ? "#fff" : NAVY,
});

// =====================================================================
// EXPORT LAPORAN KALIBRASI  (Excel via exceljs, PDF via jspdf)
// Meniru sheet "Kalibrasi" pada file
// "Laporan_Status_Kalibrasi_dan_Laporan_Pemeliharaan_Mesin_UP2W3":
//   - lebar kolom, tinggi baris, merge, border, font, logo = sama
//   - PDF digambar sel demi sel dengan ukuran yang sama seperti Excel
//     (fit-to-width, A4 landscape, header 1-12 berulang di tiap halaman)
//   - TTD: kiri "Disetujui," | kanan "Disusun Oleh,"
// Perlu:  npm i exceljs jspdf        (jspdf-autotable tidak dipakai lagi)
// Logo :  public/images/laporan/logo-pln.jpeg  &  logo-k3.jpeg
// =====================================================================

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

interface KalibrasiExportOptions {
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
async function exportKalibrasiExcel(items: AlatUkur[], opts: KalibrasiExportOptions = {}) {
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
function renderKalibrasiPdf(
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

async function exportKalibrasiPDF(items: AlatUkur[], opts: KalibrasiExportOptions = {}) {
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
const KAL_DOC_OPTIONS: KalibrasiExportOptions = {
  fileName: "Daftar-Alat-Ukur-dan-Status-Kalibrasi",
  kota: "Bandung",
  // tanggalCetak: new Date(2026, 7, 3), // kosongkan = tanggal hari ini
  nama: "BAGUS SANJAYA PUTRA", // Disusun Oleh
  jabatan: "TL Quality Control",
  disetujuiNama: "MUCHTAR BUCHORI", // Disetujui
  disetujuiJabatan: "Asman Produksi",
};

// =====================================================================
// FORM TANDA TANGAN LAPORAN (PDF & Excel)
// Nilai awal diambil dari KAL_DOC_OPTIONS di atas), lalu bisa
// diubah di dialog. Isian disimpan di localStorage (kecuali tanggal).
// =====================================================================
interface SignForm {
  kota: string;
  tanggal: string; // yyyy-mm-dd (input type="date")
  nama: string; // Disusun Oleh
  jabatan: string;
  disetujuiNama: string; // Disetujui
  disetujuiJabatan: string;
}

const SIGN_STORAGE_KEY = "kalibrasiSignForm";

const todayInput = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const defaultSignForm = (): SignForm => ({
  kota: KAL_DOC_OPTIONS.kota ?? "",
  tanggal: todayInput(),
  nama: KAL_DOC_OPTIONS.nama ?? "",
  jabatan: KAL_DOC_OPTIONS.jabatan ?? "",
  disetujuiNama: KAL_DOC_OPTIONS.disetujuiNama ?? "",
  disetujuiJabatan: KAL_DOC_OPTIONS.disetujuiJabatan ?? "",
});

const DataAlatUkurManager = () => {
  const [data, setData] = useState<AlatUkur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // =======================================================
  // ROLE (dibaca setelah mount agar tidak hydration mismatch)
  // admin & petugas: tambah/edit/pinjam | admin saja: hapus
  // Sama seperti Data Pekerjaan: role dinormalisasi (trim + lowercase).
  // =======================================================
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    try {
      setRole(localStorage.getItem("userRole"));
    } catch {
      setRole(null);
    }
  }, []);

  const normalizedRole = (role ?? "").trim().toLowerCase();
  const canWrite = normalizedRole === "admin" || normalizedRole === "petugas";
  const canDelete = normalizedRole === "admin";

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  // =======================================================
  // ALUR SCAN KARTU & VENDOR
  // =======================================================
  const [peminjamAktif, setPeminjamAktif] = useState<any>(null);
  const [scanCardModalOpen, setScanCardModalOpen] = useState(false);
  const [isVerifyingCard, setIsVerifyingCard] = useState(false);

  const [pemintaList, setPemintaList] = useState<any[]>([]);
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [pendingVendor, setPendingVendor] = useState<any>(null);

  const [activeAlatUkur, setActiveAlatUkur] = useState<AlatUkur | null>(null);
  const [cart, setCart] = useState<AlatUkur[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loanSubmitting, setLoanSubmitting] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  // ---- export PDF / Excel ----
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"pdf" | "excel">("pdf");
  const [signForm, setSignForm] = useState<SignForm>(defaultSignForm);

  // muat isian TTD terakhir (tanggal selalu hari ini)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIGN_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<SignForm>;
      setSignForm((prev) => ({ ...prev, ...saved, tanggal: prev.tanggal }));
    } catch {
      /* abaikan: pakai nilai default */
    }
  }, []);

  const scanBufferRef = useRef("");
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingScanRef = useRef(false);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 6000);
  }, []);

  const loadAlatUkur = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<AlatUkurApiResponse>("/alat-ukur");
      setData(res.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data alatukur.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVendors = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/peminta?aktif=1");
      let rawList: any[] = [];
      if (Array.isArray(res)) rawList = res;
      else if (res?.data && Array.isArray(res.data)) rawList = res.data;

      setPemintaList(rawList); // dipakai untuk dropdown peminjam manual
      setVendorList(rawList.filter((p) => p.kategori === "Vendor"));
    } catch (err) {
      console.error("Gagal meload vendor", err);
    }
  }, []);

  useEffect(() => {
    loadAlatUkur();
    loadVendors();
  }, [loadAlatUkur, loadVendors]);

  // =======================================================
  // SET PEMINJAM (dipakai scan kartu DAN dropdown manual)
  // =======================================================
  const applyPeminta = useCallback(
    (pemintaData: any) => {
      if (pendingVendor) {
        if (pemintaData.role === "inventory man") {
          setPeminjamAktif(pendingVendor);
          setSuccessMessage(
            `Peminjaman untuk Vendor disetujui oleh ${namaPeminjam(pemintaData)}`
          );
        } else {
          setPeminjamAktif(pemintaData);
          showNotice(
            `Bukan Inventory Man. Peminjam dialihkan menjadi ${namaPeminjam(pemintaData)}`
          );
        }
        setPendingVendor(null);
      } else {
        setPeminjamAktif(pemintaData);
        setSuccessMessage(`Berhasil mengidentifikasi: ${namaPeminjam(pemintaData)}`);
      }
      setScanCardModalOpen(false);
    },
    [pendingVendor, showNotice]
  );

  // Opsi dropdown: mode approval vendor -> hanya Inventory Man; normal -> non-vendor
  const manualOptions = useMemo(() => {
    const base = pendingVendor
      ? pemintaList.filter((p) => p.role === "inventory man")
      : pemintaList.filter((p) => p.kategori !== "Vendor");
    return [...base].sort((a, b) => namaPeminjam(a).localeCompare(namaPeminjam(b)));
  }, [pemintaList, pendingVendor]);

  const renderManualSelect = (label: string) => (
    <div className="text-start w-100">
      <Form.Label className="small fw-semibold mb-1">{label}</Form.Label>
      <Form.Select
        value=""
        onChange={(e) => {
          const p = manualOptions.find((x) => String(x.id) === e.target.value);
          if (p) applyPeminta(p);
        }}
      >
        <option value="">
          {manualOptions.length === 0 ? "Data peminjam belum termuat" : "-- Pilih nama --"}
        </option>
        {manualOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {namaPeminjam(p)}
            {p.divisi ? ` — ${p.divisi}` : ""}
          </option>
        ))}
      </Form.Select>
    </div>
  );

  // =======================================================
  // VERIFIKASI KARTU & LOGIKA APPROVAL VENDOR
  // =======================================================
  const verifyCard = useCallback(
    async (rfidCode: string) => {
      try {
        setIsVerifyingCard(true);
        setError(null);

        const res = await apiFetch<any>(`/peminta?rfid=${rfidCode}`);

        let rawList: any[] = [];
        if (Array.isArray(res)) rawList = res;
        else if (res?.data && Array.isArray(res.data)) rawList = res.data;
        else if (res?.data) rawList = [res.data];
        else if (res) rawList = [res];

        const pemintaData = rawList.find(
          (p: any) =>
            String(p.rfid_uid || "").trim() === String(rfidCode).trim() ||
            String(p.rfid || "").trim() === String(rfidCode).trim() ||
            String(p.id || "").trim() === String(rfidCode).trim()
        );

        if (pemintaData) {
          applyPeminta(pemintaData);
          return true;
        }

        return false;
      } catch (err: any) {
        console.error("verifyCard error:", err);
        return false;
      } finally {
        setIsVerifyingCard(false);
      }
    },
    [applyPeminta]
  );

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return data;

    return data.filter((item) => {
      return (
        item.kode_alat?.toLowerCase().includes(keyword) ||
        item.nama_alat?.toLowerCase().includes(keyword) ||
        item.merk?.toLowerCase().includes(keyword) ||
        item.sn?.toLowerCase().includes(keyword)
      );
    });
  }, [data, searchTerm]);

  const handleAddToCart = useCallback(
    (item: AlatUkur) => {
      if (!canWrite) {
        showNotice("Role Anda tidak memiliki akses untuk meminjam alat.");
        return;
      }

      if (!peminjamAktif) {
        showNotice("Pilih peminjam (scan kartu / pilih nama / vendor) terlebih dahulu.");
        setScanCardModalOpen(true);
        return;
      }

      if (isDipinjam(item)) {
        showNotice(`Alat "${item.nama_alat}" sedang dipinjam.`);
        return;
      }

      if (isRusak(item)) {
        showNotice(`Alat "${item.nama_alat}" dalam kondisi rusak (${item.kondisi}).`);
        return;
      }

      const isAlreadyInCart = cart.some((ci) => ci.id === item.id);
      if (isAlreadyInCart) {
        showNotice(`Alat "${item.nama_alat}" sudah ada di keranjang.`);
        return;
      }

      setCart((prevCart) => [...prevCart, item]);
      setSuccessMessage(
        `${item.nama_alat} ditambahkan (${namaPeminjam(peminjamAktif)}).`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    [canWrite, peminjamAktif, cart, showNotice]
  );

  // Dipakai scanner fisik (keyboard wedge) DAN kamera HP
  const handleUniversalScan = useCallback(
    async (rawCode: string) => {
      if (!canWrite) return;

      const code = rawCode.trim();
      if (!code) return;

      if (isProcessingScanRef.current) return;
      isProcessingScanRef.current = true;

      try {
        const codeUpper = code.toUpperCase();
        const matchedItem = data.find(
          (d) =>
            String(d.kode_alat || "").trim().toUpperCase() === codeUpper ||
            String(d.sn || "").trim().toUpperCase() === codeUpper
        );

        if (matchedItem) {
          handleAddToCart(matchedItem);
          return;
        }

        const isCard = await verifyCard(code);
        if (isCard) return;

        setError(`Kode "${code}" tidak dikenali.`);
      } finally {
        isProcessingScanRef.current = false;
      }
    },
    [canWrite, data, handleAddToCart, verifyCard]
  );

  useEffect(() => {
    // Viewer tidak memakai scanner
    if (!canWrite) return;

    const isModalBlocking =
      formModalOpen || detailModalOpen || deleteModalOpen || loanModalOpen || vendorModalOpen || qrModalOpen || cameraOpen || exportModalOpen;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalBlocking) return;

      const target = e.target as HTMLElement;
      const isTypingField =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if (isTypingField) return;

      if (e.key === "Enter") {
        const kode = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        if (kode) handleUniversalScan(kode);
        return;
      }

      if (e.key.length === 1) {
        scanBufferRef.current += e.key;
      }

      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
        scanBufferRef.current = "";
      }, 300);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canWrite, formModalOpen, detailModalOpen, deleteModalOpen, loanModalOpen, vendorModalOpen, qrModalOpen, cameraOpen, exportModalOpen, handleUniversalScan]);

  const handleFormSubmit = async (formData: Partial<AlatUkur>) => {
    if (!canWrite) {
      setError("Role Viewer tidak memiliki akses mengelola data alatukur.");
      return;
    }
    try {
      if (activeAlatUkur?.id) {
        await apiFetch(`/alat-ukur/${activeAlatUkur.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        setSuccessMessage("Data alatukur berhasil diperbarui!");
      } else {
        await apiFetch(`/alat-ukur`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        setSuccessMessage("Alat ukur baru berhasil ditambahkan!");
      }

      setFormModalOpen(false);
      loadAlatUkur();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan data alatukur.");
    }
  };

  const handleLoanSubmit = useCallback(
    async (values: any) => {
      if (!canWrite) {
        setLoanError("Role Viewer tidak memiliki akses meminjam alat.");
        return;
      }

      setLoanSubmitting(true);
      setLoanError(null);

      try {
        for (const item of cart) {
          const kodeAlat = item.kode_alat;
          if (!kodeAlat) throw new Error(`Alat "${item.nama_alat}" tidak valid.`);

          if (isDipinjam(item)) {
            throw new Error(`Alat "${item.nama_alat}" sedang dipinjam.`);
          }
          if (isRusak(item)) {
            throw new Error(`Alat "${item.nama_alat}" dalam kondisi rusak (${item.kondisi}).`);
          }

          await prosesPeminjamanApi({
            kodeAlat,
            pemintaId: values?.peminjamId || peminjamAktif?.id,
            pekerjaanId: values?.pekerjaanId,
            keterangan: values?.keterangan,
          });
        }

        setCart([]);
        setPeminjamAktif(null);
        setLoanModalOpen(false);
        setSuccessMessage("Peminjaman berhasil diajukan!");
        setTimeout(() => setSuccessMessage(null), 4000);
        loadAlatUkur();
      } catch (err: any) {
        setLoanError(err?.message || "Gagal menyimpan peminjaman.");
        loadAlatUkur();
      } finally {
        setLoanSubmitting(false);
      }
    },
    [canWrite, cart, peminjamAktif, loadAlatUkur]
  );

  const handleCloseScanModal = () => {
    setScanCardModalOpen(false);
    setPendingVendor(null);
  };

  const handleSelectVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;

    const vendor = vendorList.find((v) => v.id === selectedVendorId);
    if (vendor) {
      setPendingVendor(vendor);
      setVendorModalOpen(false);
      setScanCardModalOpen(true);
    }
  };

  // ---------- Download Single QR (Menyatu dengan Teks) ----------
  const handleDownloadSingleQR = async (kodeAlat: string) => {
    const element = document.getElementById(`qr-wrapper-${kodeAlat}`);
    if (!element) {
      alert("QR Code untuk alat ini tidak ditemukan di memori layar.");
      return;
    }

    try {
      const canvas = await html2canvas(element, { backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `QR-${kodeAlat}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Gagal mendownload QR", err);
      alert("Terjadi kesalahan saat memproses gambar QR.");
    }
  };

  // ---------- Export PDF / Excel (format template "Daftar Alat Ukur dan Status Kalibrasi") ----------
  // Tombol PDF / Excel membuka dialog isian TTD dulu, baru export dijalankan.
  const openExportModal = (type: "pdf" | "excel") => {
    setExportType(type);
    setExportModalOpen(true);
  };

  const handleSignChange =
    (field: keyof SignForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSignForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleResetSignForm = () => setSignForm(defaultSignForm());

  const handleExportConfirm = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const type = exportType;

    // simpan isian (tanpa tanggal) untuk pemakaian berikutnya
    try {
      const { tanggal, ...toSave } = signForm;
      void tanggal;
      localStorage.setItem(SIGN_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* abaikan */
    }

    const [y, m, d] = signForm.tanggal.split("-").map(Number);
    const tanggalCetak = y && m && d ? new Date(y, m - 1, d) : undefined;

    const opts: KalibrasiExportOptions = {
      ...KAL_DOC_OPTIONS,
      kota: signForm.kota.trim(),
      tanggalCetak,
      nama: signForm.nama.trim(),
      jabatan: signForm.jabatan.trim(),
      disetujuiNama: signForm.disetujuiNama.trim(),
      disetujuiJabatan: signForm.disetujuiJabatan.trim(),
    };

    try {
      setExporting(type);
      if (type === "pdf") await exportKalibrasiPDF(filteredData, opts);
      else await exportKalibrasiExcel(filteredData, opts);
      setExportModalOpen(false);
    } catch (err: any) {
      console.error(`Gagal export ${type}`, err);
      setExportModalOpen(false);
      setError(err?.message || `Gagal mengekspor ${type === "pdf" ? "PDF" : "Excel"}.`);
    } finally {
      setExporting(null);
    }
  };

  const step = !peminjamAktif ? 1 : cart.length === 0 ? 2 : 3;
  const stepState = (n: number): "now" | "done" | "todo" =>
    step === n ? "now" : step > n ? "done" : "todo";

  const borrowerReady = !!peminjamAktif;

  return (
    <div className="datatools-page">
      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2 small"
          style={alertStyle}
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} /><span>{successMessage}</span>
        </Alert>
      )}

      {notice && (
        <Alert
          variant="warning"
          className="d-flex align-items-center gap-2 small"
          style={alertStyle}
          dismissible
          onClose={() => setNotice(null)}
        >
          <IconAlertTriangle size={20} /><span>{notice}</span>
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          className="d-flex align-items-center gap-2 small"
          style={alertStyle}
          dismissible
          onClose={() => setError(null)}
        >
          <IconAlertTriangle size={20} /><span>{error}</span>
        </Alert>
      )}

      <Row><Col>
        <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
          <div>
            <h1 className="mb-2 h2" style={{ fontWeight: 800, color: NAVY }}>Data Alat Ukur</h1>
            <p className="text-secondary mb-2" style={{ maxWidth: 640 }}>
              {canWrite
                ? "Scan kartu atau pilih nama peminjam / vendor, lalu scan barcode alat (scanner atau kamera HP)."
                : "Daftar alat ukur beserta kondisi dan jadwal kalibrasinya."}
            </p>
            <DasherBreadcrumb />
          </div>
          {canWrite && (
            <div>
              <Button
                className="d-flex align-items-center gap-2"
                style={yellowBtnStyle}
                onClick={() => { setActiveAlatUkur(null); setFormModalOpen(true); }}
              >
                <IconPlus size={18} /> Tambah Data Alat
              </Button>
            </div>
          )}
        </Flex>
      </Col></Row>

      {canWrite && (
        <>
          <div
            className="d-flex flex-wrap justify-content-between align-items-center gap-3"
            style={{
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 12,
              border: "1px solid",
              background: borrowerReady ? "#e8f6ef" : "#fff8e1",
              borderColor: borrowerReady ? "#bfe6d2" : "#ffe08a",
            }}
          >
            <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  flex: "none",
                  background: borrowerReady ? GREEN : YELLOW,
                  color: borrowerReady ? "#fff" : NAVY,
                }}
              >
                {borrowerReady ? <IconUserCheck size={26} /> : <IconUserQuestion size={26} />}
              </span>
              <div style={{ minWidth: 0 }}>
                <span className="d-block" style={{ fontSize: ".76rem", color: MUTE }}>Peminjam aktif</span>
                <h5 className="mb-0" style={{ fontSize: "1.1rem", fontWeight: 800, color: NAVY }}>
                  {peminjamAktif
                    ? (peminjamAktif.kategori === "Vendor"
                        ? `${namaPeminjam(peminjamAktif)} (Vendor)`
                        : namaPeminjam(peminjamAktif))
                    : "Belum ada peminjam dipilih"}
                </h5>
                <span style={{ fontSize: ".78rem", color: MUTE }}>
                  {peminjamAktif
                    ? `Kategori: ${peminjamAktif.kategori || "Internal"}`
                    : "Tempelkan kartu pada reader, pilih nama di bawah, atau pilih vendor."}
                </span>
              </div>
            </div>

            {!peminjamAktif ? (
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => { setSelectedVendorId(""); setVendorModalOpen(true); }}
                  className="d-flex align-items-center gap-2 fw-semibold bg-white"
                >
                  <IconBuildingStore size={18} /> Pilih Vendor
                </Button>
                <Button
                  variant="primary"
                  style={primaryBtnStyle}
                  onClick={() => setScanCardModalOpen(true)}
                  className="d-flex align-items-center gap-2 fw-semibold"
                >
                  <IconId size={18} /> Scan Kartu
                </Button>
              </div>
            ) : (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => { setPeminjamAktif(null); setCart([]); }}
                className="d-flex align-items-center gap-1 fw-semibold bg-white"
              >
                <IconLogout size={16} /> Ganti Peminjam
              </Button>
            )}

            {/* Dropdown peminjam manual (cadangan jika scanner / PC mati) */}
            {!peminjamAktif && (
              <div style={{ flexBasis: "100%" }}>
                {renderManualSelect("Atau pilih nama peminjam secara manual")}
              </div>
            )}
          </div>

          <div className="d-flex flex-wrap gap-2 mb-4">
            <span style={stepPillStyle(stepState(1))}>
              <i style={stepNumStyle(stepState(1))}>1</i> Tentukan Peminjam
            </span>
            <span style={stepPillStyle(stepState(2))}>
              <i style={stepNumStyle(stepState(2))}>2</i> Pilih Alat
            </span>
            <span style={stepPillStyle(stepState(3))}>
              <i style={stepNumStyle(stepState(3))}>3</i> Checkout
            </span>
          </div>
        </>
      )}

      <Card
        className="card-lg mb-6"
        style={{
          borderRadius: 16,
          border: `1px solid ${LINE}`,
          borderTop: `4px solid ${BLUE}`,
          overflow: "hidden",
        }}
      >
        <div className="datatools-toolbar border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3">
          <InputGroup className="datatools-search" style={{ maxWidth: 460 }}>
            <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Cari kode, nama, merk, SN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button variant="link" className="datatools-search-clear" onClick={() => setSearchTerm("")}>
                <IconX size={16} />
              </Button>
            )}
          </InputGroup>

          {!loading && (
            <div className="d-flex flex-wrap align-items-center gap-3">
              <span style={{ fontSize: ".82rem", color: MUTE }}>
                <b style={{ color: NAVY }}>{filteredData.length}</b>
                {searchTerm ? ` dari ${data.length}` : ""} alatukur
              </span>
              <div className="d-flex flex-wrap gap-2">
                {canWrite && (
                  <Button
                    variant="primary"
                    size="sm"
                    style={primaryBtnStyle}
                    className="d-inline-flex align-items-center gap-1"
                    onClick={() => setCameraOpen(true)}
                  >
                    <IconCamera size={16} /> Scan Kamera
                  </Button>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="d-inline-flex align-items-center gap-1"
                  onClick={() => openExportModal("pdf")}
                  disabled={filteredData.length === 0 || exporting !== null}
                >
                  {exporting === "pdf" ? <Spinner animation="border" size="sm" /> : <IconFileTypePdf size={16} />} PDF
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  className="d-inline-flex align-items-center gap-1"
                  onClick={() => openExportModal("excel")}
                  disabled={filteredData.length === 0 || exporting !== null}
                >
                  {exporting === "excel" ? <Spinner animation="border" size="sm" /> : <IconFileSpreadsheet size={16} />} Excel
                </Button>
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="d-inline-flex align-items-center gap-1"
                  onClick={() => setQrModalOpen(true)}
                  disabled={filteredData.length === 0}
                >
                  <IconQrcode size={16} /> Cetak Massal QR
                </Button>
              </div>
            </div>
          )}
        </div>

        <CardBody>
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat data...
            </div>
          ) : (
            <ColumnDefinition
              items={filteredData}
              onDetail={(item) => { setActiveAlatUkur(item); setDetailModalOpen(true); }}
              onEdit={(item) => { setActiveAlatUkur(item); setFormModalOpen(true); }}
              onDelete={(item) => { setActiveAlatUkur(item); setDeleteModalOpen(true); }}
              onAddToCart={handleAddToCart}
              onDownloadQR={handleDownloadSingleQR}
              canLoan={canWrite}
              canEdit={canWrite}
              canDelete={canDelete}
            />
          )}
        </CardBody>
      </Card>

      {/* MODAL ISIAN TTD LAPORAN (PDF / Excel) */}
      <Modal
        show={exportModalOpen}
        onHide={() => { if (exporting === null) setExportModalOpen(false); }}
        centered
      >
        <Form onSubmit={handleExportConfirm}>
          <Modal.Header closeButton={exporting === null}>
            <Modal.Title className="h5 fw-bold" style={{ color: NAVY }}>
              Tanda Tangan Laporan ({exportType === "pdf" ? "PDF" : "Excel"})
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={7}>
                <Form.Group controlId="sign-kota">
                  <Form.Label className="small fw-semibold mb-1">Kota</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Bandung"
                    value={signForm.kota}
                    onChange={handleSignChange("kota")}
                  />
                </Form.Group>
              </Col>
              <Col xs={5}>
                <Form.Group controlId="sign-tanggal">
                  <Form.Label className="small fw-semibold mb-1">Tanggal</Form.Label>
                  <Form.Control
                    type="date"
                    value={signForm.tanggal}
                    onChange={handleSignChange("tanggal")}
                  />
                </Form.Group>
              </Col>

              <Col xs={12}>
                <div className="small fw-bold mt-1" style={{ color: NAVY }}>Disetujui (kiri)</div>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="sign-disetujui-nama">
                  <Form.Label className="small fw-semibold mb-1">Nama</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="MUCHTAR BUCHORI"
                    value={signForm.disetujuiNama}
                    onChange={handleSignChange("disetujuiNama")}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="sign-disetujui-jabatan">
                  <Form.Label className="small fw-semibold mb-1">Jabatan</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Asman Produksi"
                    value={signForm.disetujuiJabatan}
                    onChange={handleSignChange("disetujuiJabatan")}
                  />
                </Form.Group>
              </Col>

              <Col xs={12}>
                <div className="small fw-bold mt-1" style={{ color: NAVY }}>Disusun Oleh (kanan)</div>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="sign-nama">
                  <Form.Label className="small fw-semibold mb-1">Nama</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="BAGUS SANJAYA PUTRA"
                    value={signForm.nama}
                    onChange={handleSignChange("nama")}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="sign-jabatan">
                  <Form.Label className="small fw-semibold mb-1">Jabatan</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="TL Quality Control"
                    value={signForm.jabatan}
                    onChange={handleSignChange("jabatan")}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Text className="text-muted d-block mt-3">
              Tanda kurung pada nama ditambahkan otomatis. Kolom yang dikosongkan
              tampil sebagai titik-titik untuk ditulis tangan.
            </Form.Text>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <Button variant="link" className="text-secondary p-0" onClick={handleResetSignForm} disabled={exporting !== null}>
              Kembalikan default
            </Button>
            <div className="d-flex gap-2">
              <Button variant="light" onClick={() => setExportModalOpen(false)} disabled={exporting !== null}>
                Batal
              </Button>
              <Button
                variant={exportType === "pdf" ? "danger" : "success"}
                type="submit"
                className="d-inline-flex align-items-center gap-2"
                disabled={exporting !== null}
              >
                {exporting !== null ? (
                  <Spinner animation="border" size="sm" />
                ) : exportType === "pdf" ? (
                  <IconFileTypePdf size={16} />
                ) : (
                  <IconFileSpreadsheet size={16} />
                )}
                Export {exportType === "pdf" ? "PDF" : "Excel"}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL PILIH VENDOR */}
      <Modal show={vendorModalOpen} onHide={() => setVendorModalOpen(false)} centered>
        <Form onSubmit={handleSelectVendorSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold" style={{ color: NAVY }}>Peminjaman Eksternal</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-semibold">Pilih Instansi Vendor</Form.Label>
              <Form.Select required value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)}>
                <option value="" disabled>-- Pilih Vendor --</option>
                {vendorList.map((v) => (
                  <option key={v.id} value={v.id}>{namaPeminjam(v)}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted mt-2 d-block">
                Setelah memilih vendor, sistem akan meminta persetujuan dari <b>Inventory Man</b> melalui scan kartu atau pilih nama.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setVendorModalOpen(false)}>Batal</Button>
            <Button variant="primary" style={primaryBtnStyle} type="submit" disabled={!selectedVendorId}>Lanjutkan</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL SCAN KARTU */}
      <Modal
        show={scanCardModalOpen}
        onHide={handleCloseScanModal}
        centered
        backdrop="static"
        contentClassName="border-0 rounded-4 overflow-hidden"
      >
        <div
          style={{
            height: 6,
            background: "linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)",
          }}
        />
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 d-flex align-items-center gap-2 text-muted">
            <IconScan size={18} />
            {pendingVendor ? "Approval Peminjaman" : "Scan kartu identitas"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center pt-3 pb-5">
          {isVerifyingCard ? (
            <>
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5 style={{ fontWeight: 800, color: NAVY }}>Memverifikasi kartu...</h5>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  margin: "0 auto 18px",
                  display: "grid",
                  placeItems: "center",
                  background: "#e6f0fa",
                  color: BLUE,
                }}
              >
                {pendingVendor ? <IconUserCheck size={42} /> : <IconId size={42} />}
              </div>
              <h5 className="mb-2" style={{ fontWeight: 800, color: NAVY }}>
                {pendingVendor ? "Scan Kartu Inventory Man" : "Tempelkan kartu RFID"}
              </h5>
              <p className="text-secondary small mb-0 mx-auto" style={{ maxWidth: 320 }}>
                {pendingVendor
                  ? `Peminjaman untuk vendor ${pendingVendor.nama_peminta} memerlukan persetujuan. Jika kartu yang di-scan bukan Inventory Man, peminjam akan dialihkan ke pemilik kartu.`
                  : `Kartu harus di-scan dulu sebelum kamu bisa memilih alat.`}
              </p>

              <hr className="my-4" />
              <div className="mx-auto" style={{ maxWidth: 320 }}>
                {renderManualSelect(
                  pendingVendor
                    ? "Atau pilih nama Inventory Man"
                    : "Atau pilih nama peminjam secara manual"
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {canWrite && (
        <AlatUkurFormModal
          isOpen={formModalOpen}
          item={activeAlatUkur}
          onClose={() => setFormModalOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      <AlatUkurDetailModal item={detailModalOpen ? activeAlatUkur : null} onClose={() => setDetailModalOpen(false)} />

      {canDelete && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => loadAlatUkur()}
        />
      )}

      {canWrite && (
        <LoanFormModal
          show={loanModalOpen}
          onClose={() => setLoanModalOpen(false)}
          onSubmit={handleLoanSubmit}
          cartItems={cart}
          submitting={loanSubmitting}
          error={loanError}
          {...({ peminjam: peminjamAktif } as any)}
        />
      )}

      {/* MODAL KAMERA HP: hasil scan diteruskan ke handleUniversalScan */}
      <WebCameraScannerModal
        show={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScanSuccess={handleUniversalScan}
        title="Scan Barcode Alat"
      />

      {/* MODAL CETAK LABEL QR (Untuk fitur Print Massal) */}
      <Modal show={qrModalOpen} onHide={() => setQrModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-bold" style={{ color: NAVY }}>Cetak Label QR (Massal)</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <div id="print-qr-area" className="d-flex flex-wrap justify-content-center gap-4 p-3">
            {filteredData.map((item) => {
              const kode = item.kode_alat || item.sn || "UNKNOWN";
              return (
                <div key={item.id} className="d-flex flex-column align-items-center gap-2">
                  <div
                    className="d-flex flex-column align-items-center bg-white p-3"
                    style={{ border: "2px solid #ccc", width: "fit-content", borderRadius: "8px" }}
                  >
                    <QRCodeCanvas value={kode} size={140} level={"H"} />
                    <span className="mt-3 fw-bold text-dark text-center" style={{ fontSize: "1.4rem", letterSpacing: "2px" }}>
                      {kode}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer className="d-print-none">
          <Button variant="light" onClick={() => setQrModalOpen(false)}>Tutup</Button>
          <Button variant="primary" style={primaryBtnStyle} onClick={() => window.print()}>
            <IconQrcode size={18} className="me-2" /> Print Semua ke Kertas
          </Button>
        </Modal.Footer>
      </Modal>

      {canWrite && (
        <CartFAB
          count={cart.length}
          onClick={() => {
            if (!peminjamAktif) { showNotice("Tentukan peminjam terlebih dahulu."); setScanCardModalOpen(true); return; }
            if (cart.length === 0) { showNotice("Keranjang masih kosong. Pilih alat dulu."); return; }
            setLoanModalOpen(true);
          }}
        />
      )}

      {/* AREA TERSEMBUNYI UNTUK GENERATE GAMBAR QR CODE INDIVIDUAL (html2canvas) */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", zIndex: -1 }}>
        {data.map((item) => {
          const kode = item.kode_alat || item.sn || "UNKNOWN";
          return (
            <div
              key={`hidden-qr-${item.id}`}
              id={`qr-wrapper-${kode}`}
              className="d-flex flex-column align-items-center bg-white p-3"
              style={{ border: "2px solid #ccc", width: "fit-content", borderRadius: "8px" }}
            >
              <QRCodeCanvas value={kode} size={140} level={"H"} />
              <span className="mt-3 fw-bold text-dark text-center" style={{ fontSize: "1.4rem", letterSpacing: "2px" }}>
                {kode}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataAlatUkurManager;