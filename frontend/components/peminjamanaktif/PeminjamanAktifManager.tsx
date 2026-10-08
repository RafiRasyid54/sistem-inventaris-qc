"use client";
// import node module libraries
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  InputGroup,
  Form,
  Button,
  Modal,
  Badge,
} from "react-bootstrap";
import {
  IconSearch,
  IconX,
  IconCircleCheck,
  IconMoodEmpty,
  IconAlertTriangle,
  IconRefresh,
  IconInfoCircle,
  IconFileTypePdf,
  IconFileSpreadsheet,
} from "@tabler/icons-react";

// import custom types
import { PeminjamanAktifItemType } from "types/DataAlatUkurTypes";

// import services / API fetch
import { getPeminjamanAktif } from "services/peminjamanService";
import { exportToExcel, exportToPDF, ExportColumn } from "components/riwayat/common/exportUtils";

// import custom components & columns
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getPeminjamanAktifColumns } from "./ColumnDefination";

// Gaya halaman Peminjaman Aktif (tema PLN). Semua selector diawali .pln-pa.
const CSS = `
.pln-pa{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--line:#dbe5f1;--mute:#62708a}
.pln-pa .pa-head h1{font-weight:800;color:var(--navy)}
.pln-pa .pa-btn{background:#eef3f9;border:0;color:var(--navy);font-weight:700;border-radius:10px;display:inline-flex;align-items:center;gap:6px}
.pln-pa .pa-btn:hover{background:#e0e9f4;color:var(--navy)}
.pln-pa .pa-msg{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.88rem}
.pln-pa .pa-card{border-radius:16px;border:1px solid var(--line);border-top:4px solid var(--orange,#f08a00);overflow:hidden}
.pln-pa .pa-bar{padding:14px 18px}
.pln-pa .pa-bar .form-control:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-pa .pa-count{font-size:.82rem;color:var(--mute)}
.pln-pa .pa-count b{color:var(--navy)}
.pln-pa .pa-empty{text-align:center;padding:44px 0}
.pln-pa .pa-empty-ic{width:68px;height:68px;border-radius:18px;display:grid;place-items:center;margin:0 auto 14px}
.pln-pa .pa-empty-ic.ok{background:#dcf4ea;color:#0b7a50}
.pln-pa .pa-empty-ic.none{background:#e6f0fa;color:var(--blue)}
.pln-pa .pa-empty h5{font-weight:800;color:var(--navy)}

/* Style Khusus untuk Tab Kategori */
.pln-pa .pa-tabs{background:#eef3f9;padding:6px;border-radius:12px;display:inline-flex;gap:4px}
.pln-pa .pa-tab-btn{border:0;background:transparent;color:var(--mute);font-weight:600;font-size: 0.9rem;border-radius:8px;padding:8px 24px;transition:all .2s ease}
.pln-pa .pa-tab-btn:hover{color:var(--navy)}
.pln-pa .pa-tab-btn.active{background:#fff;color:var(--navy);box-shadow:0 2px 6px rgba(0,0,0,.06)}
@media (max-width: 576px) {
  .pln-pa .pa-tabs { width: 100%; display: flex; }
  .pln-pa .pa-tab-btn { flex: 1; text-align: center; padding: 8px 12px; font-size: 0.85rem;}
}

/* Modal Backdrop Khusus */
.pln-alert-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
`;

// ---------- Export PDF & Excel ----------
const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Kode Alat", key: "kodeBarang" },
  { header: "Nama Alat", key: "namaBarang" },
  { header: "Jumlah", key: "jumlah" },
  { header: "Peminjam", key: "namaPeminjam" },
  { header: "ID / RFID", key: "peminjamId" },
  { header: "Kategori", key: "kategori" },
  { header: "Waktu Peminjaman", key: "waktuPinjam" },
  { header: "Keterangan", key: "keterangan" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatWaktuPinjam = (item: any): string => {
  const raw = item.tanggal_pinjam || item.created_at || item.tanggalPinjam;
  if (!raw) return "-";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? String(raw) : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const PeminjamanAktifManager = () => {
  const [data, setData] = useState<PeminjamanAktifItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // STATE: Untuk melacak tab yang sedang aktif ("Internal" atau "Vendor")
  const [kategoriTab, setKategoriTab] = useState<"Internal" | "Vendor">("Internal");

  // STATE: Untuk Modal Detail
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null); // Menggunakan any sementara agar field custom bisa dipanggil

  const loadPeminjamanAktif = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await getPeminjamanAktif();

      // Ambil data array dari berbagai kemungkinan struktur response backend
      const listData = Array.isArray(res) ? res : res?.data || res?.result || [];
      setData(Array.isArray(listData) ? listData : []);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data peminjaman aktif.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeminjamanAktif();
  }, [loadPeminjamanAktif]);

  // LOGIKA FILTER: Menyaring berdasarkan Tab (Kategori) DAN Search Term
  const filteredData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    
    // 1. Filter Berdasarkan Kategori Tab (Internal / Vendor)
    const categorizedList = list.filter((item: any) => {
      const itemKategori = item.kategori || item.kategori_peminta || item.peminta?.kategori || "Internal";
      return itemKategori === kategoriTab;
    });

    // 2. Filter Berdasarkan Kata Kunci Pencarian (Search Term)
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return categorizedList;

    return categorizedList.filter((item) => {
      return (
        item.kodeBarang?.toLowerCase().includes(keyword) ||
        item.namaBarang?.toLowerCase().includes(keyword) ||
        item.namaPeminjam?.toLowerCase().includes(keyword) ||
        item.peminjamId?.toLowerCase().includes(keyword)
      );
    });
  }, [data, searchTerm, kategoriTab]);

  // COLUMNS: Mengirimkan fungsi untuk membuka modal ke definisi kolom
  const columns = useMemo(
    () =>
      getPeminjamanAktifColumns((item) => {
        setSelectedItem(item);
        setDetailModalOpen(true);
      }),
    []
  );

  // ---------- Export PDF & Excel (memakai data yang sudah terfilter: tab + pencarian) ----------
  const buildExportRows = () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filteredData.map((item: any) => ({
      kodeBarang: item.kodeBarang || "-",
      namaBarang: item.namaBarang || "-",
      jumlah: item.jumlah ?? 1,
      namaPeminjam: item.namaPeminjam || "-",
      peminjamId: item.peminjamId || "-",
      kategori: item.kategori || item.kategori_peminta || item.peminta?.kategori || "Internal",
      waktuPinjam: formatWaktuPinjam(item),
      keterangan: item.keterangan || "-",
    }));

  const exportTitle = `Peminjaman Aktif - ${kategoriTab === "Vendor" ? "Eksternal / Vendor" : "Internal PLN"}`;
  const exportFile = `peminjaman-aktif-${kategoriTab.toLowerCase()}`;

  const handleExportPDF = () =>
    exportToPDF(buildExportRows() as unknown as Record<string, unknown>[], EXPORT_COLUMNS, exportFile, exportTitle);

  const handleExportExcel = () =>
    exportToExcel(buildExportRows() as unknown as Record<string, unknown>[], EXPORT_COLUMNS, exportFile);

  return (
    <div className="peminjamanaktif-page position-relative pb-6 pln-pa">
      <style>{CSS}</style>

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100 pa-head"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Peminjaman Aktif</h1>
              <p className="text-secondary mb-2">
                Daftar alat ukur yang sedang dipinjam beserta informasi peminjamnya.
              </p>
              <DasherBreadcrumb />
            </div>
            <Button
              className="pa-btn"
              onClick={loadPeminjamanAktif}
              disabled={loading}
            >
              <IconRefresh size={16} /> Muat ulang
            </Button>
          </Flex>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="pa-msg">
          <IconAlertTriangle size={20} />
          <span>{error}</span>
        </Alert>
      )}

      <Card className="card-lg mb-6 pa-card">
        {/* ---- Toolbar: Tabs & Search ---- */}
        <div className="riwayat-toolbar border-bottom pa-bar">
          
          {/* TAB PILIHAN KATEGORI */}
          <div className="mb-3">
            <div className="pa-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={kategoriTab === "Internal"}
                className={`pa-tab-btn ${kategoriTab === "Internal" ? "active" : ""}`}
                onClick={() => setKategoriTab("Internal")}
              >
                Internal PLN
              </button>
              <button
                role="tab"
                aria-selected={kategoriTab === "Vendor"}
                className={`pa-tab-btn ${kategoriTab === "Vendor" ? "active" : ""}`}
                onClick={() => setKategoriTab("Vendor")}
              >
                Eksternal / Vendor
              </button>
            </div>
          </div>

          {/* SEARCH BAR, COUNT & EXPORT */}
          <div className="riwayat-toolbar-row d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <InputGroup className="riwayat-search" style={{ maxWidth: "400px" }}>
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder={`Cari data peminjaman ${kategoriTab.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari peminjaman aktif"
              />
              {searchTerm && (
                <Button
                  variant="link"
                  className="riwayat-search-clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="Bersihkan pencarian"
                >
                  <IconX size={16} />
                </Button>
              )}
            </InputGroup>
            
            <div className="d-flex flex-wrap align-items-center gap-3">
              <span className="riwayat-info pa-count">
                Menampilkan <b>{filteredData.length}</b> data {kategoriTab} aktif
              </span>
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
          </div>
        </div>

        <CardBody>
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data peminjaman aktif...
            </div>
          ) : !Array.isArray(data) || data.length === 0 ? (
            <div className="peminjamanaktif-empty pa-empty">
              <div className="pa-empty-ic ok">
                <IconCircleCheck size={32} />
              </div>
              <h5 className="mb-1">Tidak ada peminjaman aktif</h5>
              <p className="text-secondary mb-0">
                Semua alat ukur sudah kembali. Saat ini tidak ada yang sedang dipinjam.
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="peminjamanaktif-empty pa-empty">
              <div className="pa-empty-ic none">
                <IconMoodEmpty size={32} />
              </div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">
                Tidak ada data peminjaman aktif untuk kategori <b>{kategoriTab}</b> 
                {searchTerm ? " yang cocok dengan pencarian Anda." : "."}
              </p>
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  className="d-inline-flex align-items-center gap-2"
                  onClick={() => setSearchTerm("")}
                >
                  <IconX size={18} />
                  Reset pencarian
                </Button>
              )}
            </div>
          ) : (
            <TanstackTable
              data={filteredData}
              columns={columns}
              pagination
            />
          )}
        </CardBody>
      </Card>

      {/* MODAL DETAIL TRANSAKSI */}
      <Modal
        show={detailModalOpen}
        onHide={() => setDetailModalOpen(false)}
        centered
        backdropClassName="pln-alert-backdrop"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5 fw-bold" style={{ color: '#06355f' }}>
            <div className="d-flex align-items-center gap-2">
              <IconInfoCircle size={22} className="text-primary" />
              Detail Peminjaman
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          {selectedItem && (
            <div>
              {/* INFORMASI ALAT */}
              <div className="mb-4">
                <div className="text-muted small fw-semibold mb-1">Informasi Alat Ukur</div>
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">Kode Alat</span>
                    <span className="fw-bold font-monospace text-primary">{selectedItem.kodeBarang || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">Nama Alat</span>
                    <span className="fw-semibold text-end">{selectedItem.namaBarang || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary">Jumlah</span>
                    <span className="fw-semibold">{selectedItem.jumlah ?? 1} Unit</span>
                  </div>
                </div>
              </div>

              {/* INFORMASI PEMINJAM */}
              <div className="mb-4">
                <div className="text-muted small fw-semibold mb-1">Informasi Peminjam</div>
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">Nama Peminjam</span>
                    <span className="fw-semibold text-end">{selectedItem.namaPeminjam || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary">ID / RFID</span>
                    <span className="fw-bold font-monospace">{selectedItem.peminjamId || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary">Kategori</span>
                    <Badge bg={selectedItem.kategori === 'Vendor' ? 'info' : 'primary'}>
                      {selectedItem.kategori || "Internal"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* WAKTU TRANSAKSI */}
              <div className="mb-4">
                <div className="text-muted small fw-semibold mb-1">Waktu Transaksi</div>
                <div className="p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary">Waktu Peminjaman</span>
                    <span className="fw-semibold">
                      {selectedItem.tanggal_pinjam || selectedItem.created_at || selectedItem.tanggalPinjam
                        ? new Date(selectedItem.tanggal_pinjam || selectedItem.created_at || selectedItem.tanggalPinjam).toLocaleString("id-ID", {
                            dateStyle: 'medium', timeStyle: 'short'
                          }) 
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* KETERANGAN / CATATAN (BARU) */}
              <div>
                <div className="text-muted small fw-semibold mb-1">Keterangan / Pekerjaan</div>
                <div className="p-3 bg-light rounded-3 border">
                  <span className="fw-semibold text-dark">
                    {selectedItem.keterangan ? (
                      selectedItem.keterangan
                    ) : (
                      <span className="fst-italic text-muted fw-normal">Tidak ada keterangan spesifik yang dicatat.</span>
                    )}
                  </span>
                </div>
              </div>

            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setDetailModalOpen(false)} className="w-100 fw-bold">
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default PeminjamanAktifManager;