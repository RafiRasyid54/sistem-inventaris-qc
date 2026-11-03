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
import { exportToExcel, exportToPDF, ExportColumn } from "components/riwayat/common/exportUtils";

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

// ---------- Export PDF & Excel ----------
const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Kode Alat", key: "kodeAlat" },
  { header: "Nama Alat", key: "namaAlat" },
  { header: "Merk", key: "merk" },
  { header: "SN", key: "sn" },
  { header: "Kondisi", key: "kondisi" },
  { header: "Ketersediaan", key: "ketersediaan" },
];

const KONDISI_LABEL: Record<string, string> = {
  Baik: "Baik",
  RPP: "RPP (rusak, perlu perbaikan)",
  RT: "RT (rusak total)",
};

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
      formModalOpen || detailModalOpen || deleteModalOpen || loanModalOpen || vendorModalOpen || qrModalOpen || cameraOpen;

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
  }, [canWrite, formModalOpen, detailModalOpen, deleteModalOpen, loanModalOpen, vendorModalOpen, qrModalOpen, cameraOpen, handleUniversalScan]);

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

  const buildExportRows = () =>
    filteredData.map((item) => {
      const dipinjam = isDipinjam(item);
      const rusak = isRusak(item);
      return {
        kodeAlat: item.kode_alat || "-",
        namaAlat: item.nama_alat || "-",
        merk: item.merk || "-",
        sn: item.sn || "-",
        kondisi: KONDISI_LABEL[item.kondisi as string] ?? item.kondisi ?? "-",
        ketersediaan: dipinjam ? "Sedang dipinjam" : rusak ? "Tidak bisa dipinjam (rusak)" : "Tersedia",
      };
    });

  const handleExportPDF = () =>
    exportToPDF(buildExportRows() as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-alat-ukur", "Data Alat Ukur");

  const handleExportExcel = () =>
    exportToExcel(buildExportRows() as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-alat-ukur");

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
                  onClick={handleExportPDF}
                  disabled={filteredData.length === 0}
                >
                  <IconFileTypePdf size={16} /> PDF
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  className="d-inline-flex align-items-center gap-1"
                  onClick={handleExportExcel}
                  disabled={filteredData.length === 0}
                >
                  <IconFileSpreadsheet size={16} /> Excel
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