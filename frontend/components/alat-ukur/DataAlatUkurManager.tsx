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
} from "@tabler/icons-react";

import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";

import { ColumnDefinition } from "./ColumnDefination";
import { AlatUkurDetailModal } from "./AlatUkurDetailModal";
import { AlatUkurFormModal } from "./AlatUkurFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import LoanFormModal from "components/common/LoanFormModal";
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

const CSS = `
.pln-da{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--line:#dbe5f1;--mute:#62708a}
.pln-da .btn-primary{background:var(--blue);border-color:var(--blue)}
.pln-da .btn-primary:hover,.pln-da .btn-primary:focus{background:var(--navy);border-color:var(--navy)}
.pln-da .btn-yellow{background:var(--yellow);border:0;color:var(--navy);font-weight:700}
.pln-da .btn-yellow:hover{background:var(--yellow);color:var(--navy);filter:brightness(1.06)}
.pln-da .pda-head h1{font-weight:800;color:var(--navy)}
.pln-da .pda-head p{max-width:640px}

/* kartu peminjam aktif */
.pln-da .pda-borrower{border-radius:16px;padding:16px 20px;margin-bottom:12px;display:flex;flex-wrap:wrap;
  gap:14px;justify-content:space-between;align-items:center;border:1px solid}
.pln-da .pda-borrower.is-empty{background:#fff8e1;border-color:#ffe08a}
.pln-da .pda-borrower.is-ready{background:#e8f6ef;border-color:#bfe6d2}
.pln-da .pda-who{display:flex;align-items:center;gap:14px;min-width:0}
.pln-da .pda-av{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;flex:none}
.is-empty .pda-av{background:var(--yellow);color:var(--navy)}
.is-ready .pda-av{background:#12a36b;color:#fff}
.pln-da .pda-lb{font-size:.76rem;color:var(--mute);display:block}
.pln-da .pda-name{font-size:1.1rem;font-weight:800;color:var(--navy);margin:0}
.pln-da .pda-sub{font-size:.78rem;color:var(--mute)}

/* langkah alur */
.pln-da .pda-steps{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.pln-da .pda-step{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--mute);padding:5px 12px 5px 6px;
  border-radius:99px;background:#eef3f9}
.pln-da .pda-step i{font-style:normal;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;
  font-size:.7rem;font-weight:800;background:#cfdbea;color:var(--navy)}
.pln-da .pda-step.is-now{background:var(--navy);color:#fff;font-weight:600}
.pln-da .pda-step.is-now i{background:var(--yellow);color:var(--navy)}
.pln-da .pda-step.is-done i{background:#12a36b;color:#fff}

/* pesan */
.pln-da .pda-msg{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.88rem}

/* toolbar tabel */
.pln-da .pda-card{border-radius:16px;border:1px solid var(--line);border-top:4px solid var(--blue);overflow:hidden}
.pln-da .pda-bar{padding:14px 18px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.pln-da .pda-count{font-size:.82rem;color:var(--mute)}
.pln-da .pda-count b{color:var(--navy)}
.pln-da .pda-bar .input-group{max-width:460px}
.pln-da .pda-bar .form-control:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}

/* modal scan kartu */
.pln-alert-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pda-scan .modal-content{border:0;border-radius:20px;overflow:hidden}
.pda-scan .pda-stripe{height:6px;background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pda-scan .pda-ring{width:92px;height:92px;border-radius:50%;margin:0 auto 18px;display:grid;place-items:center;
  background:#e6f0fa;color:#0b6bb8;position:relative}
.pda-scan .pda-ring::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid #0b6bb8;opacity:.35;
  animation:pdaPulse 1.8s ease-out infinite}
@keyframes pdaPulse{from{transform:scale(.85);opacity:.5}to{transform:scale(1.25);opacity:0}}
@media (prefers-reduced-motion:reduce){.pda-scan .pda-ring::after{animation:none}}
.pda-scan h5{font-weight:800;color:#06355f}
`;

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

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  // =======================================================
  // ALUR SCAN KARTU & VENDOR
  // =======================================================
  const [peminjamAktif, setPeminjamAktif] = useState<any>(null);
  const [scanCardModalOpen, setScanCardModalOpen] = useState(false);
  const [isVerifyingCard, setIsVerifyingCard] = useState(false);

  // State khusus Vendor
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [pendingVendor, setPendingVendor] = useState<any>(null); // Vendor yg menunggu approve scan

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
      setError(err?.message || "Gagal memuat data alat ukur.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Vendor untuk Dropdown
  const loadVendors = useCallback(async () => {
    try {
      const res = await apiFetch<any>("/peminta?aktif=1");
      let rawList: any[] = [];
      if (Array.isArray(res)) rawList = res;
      else if (res?.data && Array.isArray(res.data)) rawList = res.data;

      const vendors = rawList.filter((p) => p.kategori === "Vendor");
      setVendorList(vendors);
    } catch (err) {
      console.error("Gagal meload vendor", err);
    }
  }, []);

  useEffect(() => {
    loadAlatUkur();
    loadVendors();
  }, [loadAlatUkur, loadVendors]);

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
          // LOGIKA VENDOR APPROVAL
          if (pendingVendor) {
            if (pemintaData.role === "inventory man") {
              // Sukses: Inventory man meng-approve vendor
              setPeminjamAktif(pendingVendor);
              setSuccessMessage(
                `Peminjaman untuk Vendor disetujui oleh ${namaPeminjam(pemintaData)}`
              );
            } else {
              // Gagal Approve: Kartu bukan inventory man. Peminjam beralih ke pemilik kartu
              setPeminjamAktif(pemintaData);
              showNotice(
                `Kartu bukan Inventory Man. Peminjam dialihkan menjadi ${namaPeminjam(pemintaData)}`
              );
            }
            setPendingVendor(null); // Bersihkan state pending
          } else {
            // ALUR NORMAL: Scan kartu internal biasa
            setPeminjamAktif(pemintaData);
            setSuccessMessage(
              `Berhasil mengidentifikasi: ${namaPeminjam(pemintaData)}`
            );
          }
          setScanCardModalOpen(false);
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
    [pendingVendor, showNotice]
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
      if (!peminjamAktif) {
        showNotice("Scan kartu identitas atau pilih vendor terlebih dahulu.");
        setScanCardModalOpen(true);
        return;
      }

      const statusPinjam = (item as any).status_peminjaman;
      if (statusPinjam === "Dipinjam" || statusPinjam === "sedang_dipinjam") {
        showNotice(`Alat "${item.nama_alat}" sedang dipinjam.`);
        return;
      }

      if (item.kondisi === "RPP" || item.kondisi === "RT") {
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
    [peminjamAktif, cart, showNotice]
  );

  const handleUniversalScan = useCallback(
    async (rawCode: string) => {
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
    [data, handleAddToCart, verifyCard]
  );

  useEffect(() => {
    const isModalBlocking =
      formModalOpen || detailModalOpen || deleteModalOpen || loanModalOpen || vendorModalOpen;

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
  }, [formModalOpen, detailModalOpen, deleteModalOpen, loanModalOpen, vendorModalOpen, handleUniversalScan]);

  const handleFormSubmit = async (formData: Partial<AlatUkur>) => {
    try {
      if (activeAlatUkur?.id) {
        await apiFetch(`/alat-ukur/${activeAlatUkur.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        setSuccessMessage("Data alat ukur berhasil diperbarui!");
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
      setError(err?.message || "Gagal menyimpan data alat ukur.");
    }
  };

  const handleLoanSubmit = useCallback(
    async (values: any) => {
      setLoanSubmitting(true);
      setLoanError(null);

      try {
        for (const item of cart) {
          const kodeAlat = item.kode_alat;
          if (!kodeAlat) throw new Error(`Alat "${item.nama_alat}" tidak valid.`);

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
      } catch (err: any) {
        setLoanError(err?.message || "Gagal menyimpan peminjaman.");
      } finally {
        setLoanSubmitting(false);
      }
    },
    [cart, peminjamAktif]
  );

  const handleCloseScanModal = () => {
    setScanCardModalOpen(false);
    setPendingVendor(null); // Reset pending vendor jika batal scan
  };

  const handleSelectVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;
    
    const vendor = vendorList.find((v) => v.id === selectedVendorId);
    if (vendor) {
      setPendingVendor(vendor);
      setVendorModalOpen(false);
      setScanCardModalOpen(true); // Langsung buka modal scan untuk approval
    }
  };

  // ---------- Export PDF & Excel (memakai data yang sudah terfilter) ----------
  const buildExportRows = () =>
    filteredData.map((item) => {
      const statusPinjam = (item as { status_peminjaman?: string }).status_peminjaman;
      const dipinjam = statusPinjam === "Dipinjam" || statusPinjam === "sedang_dipinjam";
      const rusak = item.kondisi === "RPP" || item.kondisi === "RT";
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
  const stepClass = (n: number) => (step === n ? "is-now" : step > n ? "is-done" : "");

  return (
    <div className="datatools-page pln-da">
      <style>{CSS}</style>

      {successMessage && (
        <Alert variant="success" className="pda-msg" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} /><span>{successMessage}</span>
        </Alert>
      )}

      {notice && (
        <Alert variant="warning" className="pda-msg" dismissible onClose={() => setNotice(null)}>
          <IconAlertTriangle size={20} /><span>{notice}</span>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="pda-msg" dismissible onClose={() => setError(null)}>
          <IconAlertTriangle size={20} /><span>{error}</span>
        </Alert>
      )}

      <Row><Col>
        <Flex justifyContent="between" alignItems="center" className="mb-4 w-100 pda-head" breakpoint="md">
          <div>
            <h1 className="mb-2 h2">Data Alat Ukur</h1>
            <p className="text-secondary mb-2">
              Scan kartu identitas peminjam atau pilih vendor, lalu scan barcode alat.
            </p>
            <DasherBreadcrumb />
          </div>
          <div>
            <Button className="btn-yellow d-flex align-items-center gap-2" onClick={() => { setActiveAlatUkur(null); setFormModalOpen(true); }}>
              <IconPlus size={18} /> Tambah Data Alat
            </Button>
          </div>
        </Flex>
      </Col></Row>

      {/* PEMINJAM AKTIF */}
      <div className={`pda-borrower ${peminjamAktif ? "is-ready" : "is-empty"}`}>
        <div className="pda-who">
          <span className="pda-av">
            {peminjamAktif ? <IconUserCheck size={26} /> : <IconUserQuestion size={26} />}
          </span>
          <div className="min-w-0">
            <span className="pda-lb">Peminjam aktif</span>
            <h5 className="pda-name">
              {peminjamAktif ? (peminjamAktif.kategori === 'Vendor' ? `${namaPeminjam(peminjamAktif)} (Vendor)` : namaPeminjam(peminjamAktif)) : "Belum ada peminjam dipilih"}
            </h5>
            <span className="pda-sub">
              {peminjamAktif
                ? `Kategori: ${peminjamAktif.kategori || 'Internal'}`
                : "Tempelkan kartu pada reader, atau pilih vendor."}
            </span>
          </div>
        </div>

        {!peminjamAktif ? (
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => { setSelectedVendorId(""); setVendorModalOpen(true); }} className="d-flex align-items-center gap-2 fw-semibold bg-white">
              <IconBuildingStore size={18} /> Pilih Vendor
            </Button>
            <Button variant="primary" onClick={() => setScanCardModalOpen(true)} className="d-flex align-items-center gap-2 fw-semibold">
              <IconId size={18} /> Scan Kartu
            </Button>
          </div>
        ) : (
          <Button variant="outline-danger" size="sm" onClick={() => { setPeminjamAktif(null); setCart([]); }} className="d-flex align-items-center gap-1 fw-semibold bg-white">
            <IconLogout size={16} /> Ganti Peminjam
          </Button>
        )}
      </div>

      <div className="pda-steps">
        <span className={`pda-step ${stepClass(1)}`}><i>1</i> Tentukan Peminjam</span>
        <span className={`pda-step ${stepClass(2)}`}><i>2</i> Pilih Alat</span>
        <span className={`pda-step ${stepClass(3)}`}><i>3</i> Checkout</span>
      </div>

      <Card className="card-lg mb-6 pda-card">
        <div className="datatools-toolbar border-bottom pda-bar">
          <InputGroup className="datatools-search">
            <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
            <Form.Control type="search" placeholder="Cari kode, nama, merk, SN..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && <Button variant="link" className="datatools-search-clear" onClick={() => setSearchTerm("")}><IconX size={16} /></Button>}
          </InputGroup>

          {!loading && (
            <div className="d-flex flex-wrap align-items-center gap-3">
              <span className="pda-count"><b>{filteredData.length}</b>{searchTerm ? ` dari ${data.length}` : ""} alat ukur</span>
              <div className="d-flex gap-2">
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
            />
          )}
        </CardBody>
      </Card>

      {/* MODAL PILIH VENDOR */}
      <Modal show={vendorModalOpen} onHide={() => setVendorModalOpen(false)} centered backdropClassName="pln-alert-backdrop">
        <Form onSubmit={handleSelectVendorSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold text-navy">Peminjaman Eksternal</Modal.Title>
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
                Setelah memilih vendor, sistem akan meminta persetujuan dari <b>Inventory Man</b> melalui scan kartu.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setVendorModalOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit" disabled={!selectedVendorId}>Lanjutkan</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL SCAN KARTU (BISA UNTUK INTERNAL ATAU APPROVAL VENDOR) */}
      <Modal
        show={scanCardModalOpen}
        onHide={handleCloseScanModal}
        centered
        backdrop="static"
        dialogClassName="pda-scan"
        backdropClassName="pln-alert-backdrop"
      >
        <div className="pda-stripe" />
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
              <h5>Memverifikasi kartu...</h5>
            </>
          ) : (
            <>
              <div className="pda-ring">
                {pendingVendor ? <IconUserCheck size={42} /> : <IconId size={42} />}
              </div>
              <h5 className="mb-2">
                {pendingVendor ? "Scan Kartu Inventory Man" : "Tempelkan kartu RFID"}
              </h5>
              <p className="text-secondary small mb-0 mx-auto" style={{ maxWidth: 320 }}>
                {pendingVendor
                  ? `Peminjaman untuk vendor ${pendingVendor.nama_peminta} memerlukan persetujuan. Jika kartu yang di-scan bukan Inventory Man, peminjam akan dialihkan ke pemilik kartu.`
                  : `Kartu harus di-scan dulu sebelum kamu bisa memilih alat.`}
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>

      <AlatUkurFormModal isOpen={formModalOpen} item={activeAlatUkur} onClose={() => setFormModalOpen(false)} onSubmit={handleFormSubmit} />
      <AlatUkurDetailModal item={detailModalOpen ? activeAlatUkur : null} onClose={() => setDetailModalOpen(false)} />
      <DeleteConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={() => loadAlatUkur()} />

      <LoanFormModal show={loanModalOpen} onClose={() => setLoanModalOpen(false)} onSubmit={handleLoanSubmit} cartItems={cart} submitting={loanSubmitting} error={loanError} {...({ peminjam: peminjamAktif } as any)} />

      <CartFAB count={cart.length} onClick={() => {
          if (!peminjamAktif) { showNotice("Tentukan peminjam terlebih dahulu."); setScanCardModalOpen(true); return; }
          if (cart.length === 0) { showNotice("Keranjang masih kosong. Pilih alat dulu."); return; }
          setLoanModalOpen(true);
      }} />
    </div>
  );
};

export default DataAlatUkurManager;