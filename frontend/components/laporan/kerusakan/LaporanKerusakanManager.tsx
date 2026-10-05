"use client";
import { useEffect, useMemo, useState } from "react";
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
} from "react-bootstrap";
import {
  IconAlertTriangle,
  IconSearch,
  IconX,
  IconCircleCheck,
  IconFilterOff,
} from "@tabler/icons-react";

import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/riwayat/common/RiwayatFilterBar"; 
import {
  DateFilterValue,
  dateInFilter,
  parseRowDate,
} from "components/common/dateUtils"; 
import {
  exportToExcel,
  exportToPDF,
  ExportColumn,
  getFilteredExportFileName,
} from "components/riwayat/common/exportUtils"; 

// Karena 3 file ini ada di folder yang sama dengan Manager, gunakan "./"
import { getLaporanKerusakanColumns } from "./ColumnDefination";
import DetailLaporanModal from "./DetailLaporanModal";
import ConfirmActionModal from "./ConfirmActionModal";
import { getLaporanKerusakan, repairLaporanKerusakan, tandaiPermanenLaporanKerusakan } from "services/laporanKerusakanService";
import { usePermission } from "hooks/usePermissions";

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Tgl & Jam Pengembalian", key: "tanggal_pengembalian" },
  { header: "Kode Barang", key: "kode_barang" },
  { header: "Nama Barang", key: "nama_barang" },
  { header: "Merk", key: "merk" },
  { header: "Tipe", key: "tipe" },
  { header: "Warna", key: "warna" },
  { header: "Ukuran", key: "ukuran" },
  { header: "Jumlah Rusak", key: "jumlah_rusak" },
  { header: "Nama Peminjam", key: "nama_peminjam" },
  { header: "Divisi", key: "divisi" },
  { header: "Nama Pekerjaan", key: "nama_pekerjaan" },
  { header: "Area Kerja", key: "area_kerja" },
  { header: "Keterangan", key: "keterangan" },
];

const STATUS_ORDER: Record<string, number> = {
  bisa_diperbaiki: 0,
  rusak_permanen: 1,
};

// Gaya halaman Laporan Kerusakan (tema PLN). Semua selector diawali .pln-lk.
const CSS = `
.pln-lk{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--line:#dbe5f1;--mute:#62708a}
.pln-lk .lk-head h1{font-weight:800;color:var(--navy)}
.pln-lk .lk-head p{max-width:640px}

/* pesan */
.pln-lk .lk-msg{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.88rem}

/* kartu tabel */
.pln-lk .lk-card{border-radius:16px;border:1px solid var(--line);border-top:4px solid var(--blue);overflow:hidden}
.pln-lk .lk-card .form-control:focus,.pln-lk .lk-card .form-select:focus{
  border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-lk .lk-info b{color:var(--navy)}

/* toolbar: beri jarak dari tepi kartu, search + info sebaris */
.pln-lk .lk-card .riwayat-toolbar{padding:14px 18px;display:flex;flex-direction:column;gap:12px;background:#fff}
.pln-lk .lk-card .riwayat-toolbar-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}
.pln-lk .lk-card .riwayat-search{flex:1 1 280px;max-width:460px}
.pln-lk .lk-card .riwayat-info{font-size:.82rem;white-space:nowrap}

/* tabel */
.pln-lk .lk-card table thead th{background:#eef3f9;color:var(--navy);font-size:.74rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.02em;border-bottom:1px solid var(--line);white-space:nowrap;padding:.75rem .9rem}
.pln-lk .lk-card table tbody td{padding:.8rem .9rem;font-size:.85rem;color:#14233b;vertical-align:middle}
.pln-lk .lk-card table tbody tr:hover>*{background:#f6f9fc}
/* kolom Aksi tetap terlihat saat tabel digeser ke samping */
.pln-lk .lk-card table th:last-child,.pln-lk .lk-card table td:last-child{position:sticky;right:0;z-index:1;
  box-shadow:-8px 0 8px -8px rgba(6,53,95,.18)}
.pln-lk .lk-card table td:last-child{background:#fff}
.pln-lk .lk-card .page-item.active .page-link{background:var(--blue);border-color:var(--blue);color:#fff}
.pln-lk .lk-card .page-link{color:var(--navy)}

/* empty state */
.pln-lk .lk-empty-icon{width:72px;height:72px;border-radius:50%;margin:0 auto;display:grid;place-items:center;
  background:#e6f0fa;color:var(--blue)}
.pln-lk .lk-empty.is-filter .lk-empty-icon{background:#fff8e1;color:#9a6a00}
.pln-lk .lk-empty h5{font-weight:800;color:var(--navy)}
`;

const LaporanKerusakanManager = () => {
  const canProcess = usePermission("manage_kerusakan_alat");
  const [laporanList, setLaporanList] = useState<LaporanKerusakanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLaporanKerusakan();
      setLaporanList(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat laporan kerusakan";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    type: "repair" | "permanen";
    item: LaporanKerusakanType;
  } | null>(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  // Error aksi ditampilkan di dalam modal (pengganti alert() bawaan browser)
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [repairNote, setRepairNote] = useState("");
  const [repairSeverity, setRepairSeverity] = useState<"ringan" | "berat" | "">("");

  const handleRepair = (item: LaporanKerusakanType) => {
    setRepairNote("");
    setRepairSeverity("");
    setConfirmError(null);
    setConfirmModal({ type: "repair", item });
  };

  const handleTandaiPermanen = (item: LaporanKerusakanType) => {
    setConfirmError(null);
    setConfirmModal({ type: "permanen", item });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, item } = confirmModal;
    setConfirmSubmitting(true);
    setConfirmError(null);

    try {
      if (type === "repair") {
        const isMesin = item.kategori_alat === "mesin";
        const severityDikirim = isMesin ? (repairSeverity || undefined) : undefined;

        await repairLaporanKerusakan(item.id, repairNote.trim() || undefined, severityDikirim);
        setLaporanList((prev) =>
          prev.map((l) =>
            l.id === item.id
              ? { ...l, status: "selesai_diperbaiki" as const, tingkat_kerusakan: severityDikirim }
              : l
          )
        );
        setSuccessMessage(`${item.nama_barang} berhasil ditandai selesai diperbaiki, stok telah dikembalikan.`);
      } else {
        await tandaiPermanenLaporanKerusakan(item.id);
        setLaporanList((prev) =>
          prev.map((l) => (l.id === item.id ? { ...l, status: "rusak_permanen" as const } : l))
        );
        setSuccessMessage(`${item.nama_barang} ditandai sebagai Rusak Permanen.`);
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      setConfirmModal(null);
    } catch (err) {
      setConfirmError(
        err instanceof Error
          ? err.message
          : type === "repair"
          ? "Gagal memproses repair alat"
          : "Gagal menandai laporan sebagai rusak permanen"
      );
    } finally {
      setConfirmSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [tanggalFilter, setTanggalFilter] = useState<DateFilterValue | null>(null);
  const [namaFilter, setNamaFilter] = useState("");

  // ---- Pencarian (murni UI, tidak menyentuh API/data) ----
  const [searchTerm, setSearchTerm] = useState("");

  // namaOptions dihitung dari data yang benar-benar tampil di tabel
  // (exclude selesai_diperbaiki), sehingga dropdown nama hanya berisi
  // nama yang masih ada di tabel saat ini.
  const visibleList = useMemo(() => {
    return laporanList.filter((r) => r.status !== "selesai_diperbaiki");
  }, [laporanList]);

  const namaOptions = useMemo(() => {
    const namaSet = new Set(visibleList.map((r) => r.nama_peminjam));
    return Array.from(namaSet).sort();
  }, [visibleList]);

  const repairCountByKode = useMemo(() => {
    const map: Record<string, number> = {};
    laporanList.forEach((l) => {
      // Rusak ringan tidak dihitung ke batas maksimal perbaikan,
      // konsisten dengan logika perbaikan_ke di backend.
      if (l.status === "selesai_diperbaiki" && l.tingkat_kerusakan !== "ringan") {
        map[l.kode_barang] = (map[l.kode_barang] ?? 0) + 1;
      }
    });
    return map;
  }, [laporanList]);

  const filteredList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return laporanList
      .filter((r) => {
        // Halaman ini cuma untuk laporan yang masih perlu ditindaklanjuti.
        if (r.status === "selesai_diperbaiki") return false;

        // Filter tanggal (rentang atau satu bulan)
        if (tanggalFilter) {
          const tanggal = parseRowDate(r.tanggal_pengembalian);
          if (tanggal && !dateInFilter(tanggal, tanggalFilter)) return false;
        }

        // Filter nama peminjam
        if (namaFilter !== "" && r.nama_peminjam !== namaFilter)
          return false;

        // Filter pencarian
        if (keyword !== "") {
          const cocok =
            r.kode_barang.toLowerCase().includes(keyword) ||
            r.nama_barang.toLowerCase().includes(keyword) ||
            r.nama_peminjam.toLowerCase().includes(keyword);

          if (!cocok) return false;
        }

        return true;
      })
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [
    laporanList,
    tanggalFilter,
    namaFilter,
    searchTerm,
  ]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<LaporanKerusakanType | null>(null);

  const openDetailModal = (item: LaporanKerusakanType) => {
    setActiveItem(item);
    setDetailModalOpen(true);
  };

  const handleExportPDF = () =>
    exportToPDF(filteredList, EXPORT_COLUMNS, getFilteredExportFileName("Laporan_Kerusakan_Alat", namaFilter), "Laporan Kerusakan Alat");
  const handleExportExcel = () =>
    exportToExcel(filteredList, EXPORT_COLUMNS, getFilteredExportFileName("Laporan_Kerusakan_Alat", namaFilter));

  const columns = getLaporanKerusakanColumns({
    canProcess,
    onDetail: openDetailModal,
    onRepair: handleRepair,
    onTandaiPermanen: handleTandaiPermanen,
  });

  return (
    <div className="riwayat-page laporan-kerusakan-page pln-lk">
      <style>{CSS}</style>

      {successMessage && (
        <Alert
          variant="success"
          className="lk-msg"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          <span>{successMessage}</span>
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          className="lk-msg"
          dismissible
          onClose={() => setError(null)}
        >
          <IconAlertTriangle size={20} />
          <span>{error}</span>
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100 lk-head" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Laporan Kerusakan Alat</h1>
              <p className="text-secondary mb-2">
                Menampilkan seluruh data alat yang mengalami kerusakan berdasarkan hasil pengembalian dari proses peminjaman.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6 lk-card">
        <div className="riwayat-toolbar border-bottom">
          <div className="riwayat-toolbar-row">
            <InputGroup className="riwayat-search">
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari kode, nama barang, atau informasi lainnya..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari laporan kerusakan"
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

            <span className="riwayat-info lk-info text-secondary small">
              Menampilkan <b>{filteredList.length}</b> dari {laporanList.length} data
            </span>
          </div>

          <RiwayatFilterBar
            tanggalFilter={tanggalFilter}
            onTanggalFilterChange={setTanggalFilter}
            namaFilter={namaFilter}
            onNamaFilterChange={setNamaFilter}
            namaOptions={namaOptions}
            namaLabel="Nama Peminjam"
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
        </div>

        <CardBody>
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : laporanList.length === 0 ? (
            <div className="lk-empty text-center py-6">
              <div className="lk-empty-icon mb-3">
                <IconAlertTriangle size={32} />
              </div>
              <h5 className="mb-1">Belum ada laporan kerusakan</h5>
              <p className="text-secondary mb-0">
                Kerusakan alat yang tercatat saat pengembalian akan muncul di sini.
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="lk-empty is-filter text-center py-6">
              <div className="lk-empty-icon mb-3">
                <IconFilterOff size={32} />
              </div>
              <h5 className="mb-1">Tidak ada data yang cocok</h5>
              <p className="text-secondary mb-0">
                Coba ubah kata kunci pencarian atau filter bulan/tahun.
              </p>
            </div>
          ) : (
            <TanstackTable
              data={filteredList}
              columns={columns}
              pagination
            />
          )}
        </CardBody>
      </Card>

      <DetailLaporanModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} item={activeItem} />

      {confirmModal && (
        <ConfirmActionModal
          show={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirmAction}
          submitting={confirmSubmitting}
          error={confirmError}
          variant={confirmModal.type === "repair" ? "success" : "danger"}
          title={
            confirmModal.type === "repair"
              ? "Tandai Sudah Diperbaiki?"
              : "Tandai Rusak Permanen?"
          }
          message={
            confirmModal.type === "repair"
              ? `"${confirmModal.item.nama_barang}" akan ditandai selesai diperbaiki dan stok alat otomatis dikembalikan. Riwayatnya bisa dilihat di menu Riwayat > Riwayat Perbaikan.`
              : `"${confirmModal.item.nama_barang}" tidak akan bisa diperbaiki lagi. Opsi Repair untuk laporan ini akan hilang.`
          }
          confirmLabel={confirmModal.type === "repair" ? "Ya, Sudah Diperbaiki" : "Ya, Rusak Permanen"}
          showNoteInput={confirmModal.type === "repair"}
          noteValue={repairNote}
          onNoteChange={setRepairNote}
          showSeverityInput={confirmModal.type === "repair" && confirmModal.item.kategori_alat === "mesin"}
          severityValue={repairSeverity}
          onSeverityChange={setRepairSeverity}
          confirmDisabled={
            confirmModal.type === "repair" &&
            (repairNote.trim() === "" ||
              (confirmModal.item.kategori_alat === "mesin" && repairSeverity === ""))
          }
          warningText={
            confirmModal.type === "repair" &&
            confirmModal.item.kategori_alat === "mesin" &&
            (repairCountByKode[confirmModal.item.kode_barang] ?? 0) >= 2
              ? `Alat ini sudah diperbaiki ${repairCountByKode[confirmModal.item.kode_barang]}x sebelumnya. Ini akan menjadi perbaikan ke-${
                  (repairCountByKode[confirmModal.item.kode_barang] ?? 0) + 1
                }. Mesin umumnya hanya bisa diperbaiki maksimal 3x — pertimbangkan menandai Rusak Permanen jika kerusakan berulang.`
              : undefined
          }
        />
      )}
    </div>
  );
};

export default LaporanKerusakanManager;