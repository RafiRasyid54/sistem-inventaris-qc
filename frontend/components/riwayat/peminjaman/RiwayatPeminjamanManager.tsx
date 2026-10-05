"use client";
// import node module libraries
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
  IconHistory,
  IconSearch,
  IconX,
  IconAlertTriangle,
  IconFilterOff,
} from "@tabler/icons-react";

import { RiwayatPeminjamanType } from "types/RiwayatTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/riwayat/common/RiwayatFilterBar";
import {
  DateFilterValue,
  dateInFilter,
  parseRowDate,
} from "components/riwayat/common/dateUtils";
import { getRiwayatPeminjamanColumns } from "components/riwayat/peminjaman/ColumnDefination";
import DetailTransaksiModal from "components/riwayat/peminjaman/DetailTransaksiModal";
import { exportToExcel, exportToPDF, ExportColumn, getFilteredExportFileName } from "components/riwayat/common/exportUtils";

import { getRiwayatPeminjaman } from "services/peminjamanService";

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Tanggal Pinjam", key: "tanggal_pinjam" },
  { header: "Tanggal Kembali", key: "tanggal_kembali" },
  { header: "Kode Barang", key: "kode_barang" },
  { header: "Nama Barang", key: "nama_barang" },
  { header: "Merk", key: "merk" },
  { header: "Tipe", key: "tipe" },
  { header: "Warna", key: "warna" },
  { header: "Ukuran", key: "ukuran" },
  { header: "Jumlah", key: "jumlah" },
  { header: "Nama Peminjam", key: "nama_peminjam" },
  { header: "Divisi", key: "divisi" },
  { header: "Nama Pekerjaan", key: "nama_pekerjaan" },
  { header: "Area Kerja", key: "area_kerja" },
  { header: "Kategori", key: "kategori" }, // Menambahkan kategori untuk export
];

type KategoriTab = "Internal" | "Vendor";

// Kategori bisa datang dengan beberapa nama field dari backend; default "Internal".
const getKategori = (r: RiwayatPeminjamanType): string =>
  (r as any).kategori || (r as any).kategori_peminta || (r as any).peminta?.kategori || "Internal";

// Gaya halaman Riwayat Peminjaman (tema PLN). Semua selector diawali .pln-rp.
const CSS = `
.pln-rp{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--line:#dbe5f1;--mute:#62708a}
.pln-rp .pr-head h1{font-weight:800;color:var(--navy)}
.pln-rp .pr-head p{max-width:640px}
.pln-rp .pr-msg{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.88rem}

/* kartu tabel */
.pln-rp .pr-card{border-radius:16px;border:1px solid var(--line);border-top:4px solid var(--blue);overflow:hidden}
.pln-rp .pr-card .input-group .form-control:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}

/* toolbar: tiga bagian dengan jarak tegas (!important agar menang dari CSS global .riwayat-toolbar) */
.pln-rp .pr-toolbar{background:#fff;padding:0!important}
.pln-rp .pr-sec{padding:0 28px!important}
.pln-rp .pr-sec-top{padding-top:22px!important;display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between}
.pln-rp .pr-sec-search{padding-top:18px!important}
.pln-rp .pr-sec-filter{padding-top:18px!important;padding-bottom:24px!important}
.pln-rp .pr-sec-filter>*{margin:0!important;padding:0!important;width:100%;gap:14px!important;flex-wrap:wrap!important}
.pln-rp .pr-info{font-size:.85rem;color:var(--mute)}
.pln-rp .pr-info b{color:var(--navy)}
.pln-rp .pr-sec-search .riwayat-search{width:100%;max-width:480px;margin:0!important}
.pln-rp .pr-sec-search .input-group-text,.pln-rp .pr-sec-search .form-control{padding-top:11px;padding-bottom:11px}

/* isi tabel: ruang di tepi dan sel yang lega */
.pln-rp .pr-body{padding:12px 28px 24px!important}
.pln-rp .pr-card table th,.pln-rp .pr-card table td{padding:14px 16px!important;vertical-align:middle}
.pln-rp .pr-card table th{white-space:nowrap}

/* tab kategori */
.pln-rp .pa-tabs{background:#eef3f9;padding:5px;border-radius:12px;display:inline-flex;gap:4px}
.pln-rp .pa-tab-btn{border:0;background:transparent;color:var(--mute);font-weight:600;font-size:.9rem;border-radius:9px;
  padding:8px 18px;display:inline-flex;align-items:center;gap:8px;transition:all .2s ease}
.pln-rp .pa-tab-btn:hover{color:var(--navy)}
.pln-rp .pa-tab-btn.active{background:#fff;color:var(--navy);box-shadow:0 2px 6px rgba(6,53,95,.1)}
.pln-rp .pa-tab-btn:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.pln-rp .pa-tab-n{font-size:.72rem;font-weight:700;min-width:22px;text-align:center;padding:1px 7px;border-radius:99px;background:#dbe5f1;color:var(--navy)}
.pln-rp .pa-tab-btn.active .pa-tab-n{background:var(--yellow)}

/* tabel */
.pln-rp .pr-card table thead th{background:#eef3f9;color:var(--navy);font-size:.76rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.02em;border-bottom:1px solid var(--line)}
.pln-rp .pr-card table tbody tr:hover>*{background:#f6f9fc}
.pln-rp .pr-card .page-item.active .page-link{background:var(--blue);border-color:var(--blue);color:#fff}
.pln-rp .pr-card .page-link{color:var(--navy)}

/* empty state */
.pln-rp .pr-empty-icon{width:72px;height:72px;border-radius:50%;margin:0 auto;display:grid;place-items:center;
  background:#e6f0fa;color:var(--blue)}
.pln-rp .pr-empty.is-filter .pr-empty-icon{background:#fff8e1;color:#9a6a00}
.pln-rp .pr-empty h5{font-weight:800;color:var(--navy)}

@media (max-width:576px){
  .pln-rp .pr-sec{padding:0 16px!important}
  .pln-rp .pr-body{padding:12px 12px 20px!important}
  .pln-rp .pa-tabs{width:100%;display:flex}
  .pln-rp .pa-tab-btn{flex:1;justify-content:center;padding:8px 10px;font-size:.85rem}
}
`;

const RiwayatPeminjamanManager = () => {
  const [riwayatList, setRiwayatList] = useState<RiwayatPeminjamanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab yang sedang aktif ("Internal" atau "Vendor")
  const [kategoriTab, setKategoriTab] = useState<KategoriTab>("Internal");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRiwayatPeminjaman();
      setRiwayatList(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat riwayat peminjaman";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---- Filter Tanggal (rentang/bulan, via DateRangePicker) ----
  const [tanggalFilter, setTanggalFilter] = useState<DateFilterValue | null>(null);
  const [namaFilter, setNamaFilter] = useState("");

  // ---- Pencarian (murni UI, tidak menyentuh API/data) ----
  const [searchTerm, setSearchTerm] = useState("");

  const namaOptions = useMemo(() => {
    const namaSet = new Set(riwayatList.map((r) => r.nama_peminjam));
    return Array.from(namaSet).sort();
  }, [riwayatList]);

  // Jumlah data per kategori, ditampilkan di tab supaya tidak perlu pindah tab untuk tahu isinya
  const jumlahPerKategori = useMemo(() => {
    let internal = 0;
    let vendor = 0;
    riwayatList.forEach((r) => {
      if (getKategori(r) === "Vendor") vendor += 1;
      else if (getKategori(r) === "Internal") internal += 1;
    });
    return { Internal: internal, Vendor: vendor };
  }, [riwayatList]);

  // Menyaring berdasarkan Tab (Kategori), Tanggal, Nama Peminjam, dan Search Term
  const filteredList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return riwayatList.filter((r) => {
      // 1. Filter Berdasarkan Kategori Tab (Internal / Vendor)
      if (getKategori(r) !== kategoriTab) return false;

      // 2. Filter tanggal (rentang atau satu bulan)
      if (tanggalFilter) {
        const tanggal = parseRowDate(r.tanggal_pinjam);
        if (tanggal && !dateInFilter(tanggal, tanggalFilter)) return false;
      }

      // 3. Filter nama peminjam (dari dropdown FilterBar)
      if (namaFilter !== "" && r.nama_peminjam !== namaFilter) return false;

      // 4. Filter pencarian teks
      if (keyword !== "") {
        const tglPinjam = (r.tanggal_pinjam || "").toLowerCase();
        const tglKembali = (r.tanggal_kembali || "").toLowerCase();
        const kodeBarang = (r.kode_barang || "").toLowerCase();
        const namaBarang = (r.nama_barang || "").toLowerCase();
        const merk = (r.merk || "").toLowerCase();
        const tipe = (r.tipe || "").toLowerCase();
        const warna = (r.warna || "").toLowerCase();
        const ukuran = (r.ukuran || "").toLowerCase();
        const jumlah = String(r.jumlah ?? 0);
        const namaPeminjam = (r.nama_peminjam || "").toLowerCase();
        const noTransaksi = (r.nomor_transaksi || "").toLowerCase();

        const cocok =
          tglPinjam.includes(keyword) ||
          tglKembali.includes(keyword) ||
          kodeBarang.includes(keyword) ||
          namaBarang.includes(keyword) ||
          merk.includes(keyword) ||
          tipe.includes(keyword) ||
          warna.includes(keyword) ||
          ukuran.includes(keyword) ||
          jumlah.includes(keyword) ||
          namaPeminjam.includes(keyword) ||
          noTransaksi.includes(keyword);

        if (!cocok) return false;
      }

      return true;
    });
  }, [riwayatList, tanggalFilter, namaFilter, searchTerm, kategoriTab]);

  // ---- Modal Detail Transaksi ----
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailGroupItems, setDetailGroupItems] = useState<RiwayatPeminjamanType[]>([]);

  const openDetailModal = (item: RiwayatPeminjamanType) => {
    const group = riwayatList.filter(
      (r) => r.nomor_transaksi === item.nomor_transaksi
    );
    setDetailGroupItems(group);
    setDetailModalOpen(true);
  };

  const handleExportPDF = () =>
    exportToPDF(filteredList, EXPORT_COLUMNS, getFilteredExportFileName(`Riwayat_Peminjaman_${kategoriTab}`, namaFilter), "Riwayat Peminjaman Tools");
  const handleExportExcel = () =>
    exportToExcel(filteredList, EXPORT_COLUMNS, getFilteredExportFileName(`Riwayat_Peminjaman_${kategoriTab}`, namaFilter));

  const columns = getRiwayatPeminjamanColumns({
    onDetail: openDetailModal,
  });

  return (
    <div className="riwayat-page riwayat-peminjaman-page pln-rp">
      <style>{CSS}</style>

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100 pr-head" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Riwayat Peminjaman Tools</h1>
              <p className="text-secondary mb-2">
                Menampilkan riwayat seluruh transaksi peminjaman tools yang telah dikembalikan.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      {error && (
        <Alert
          variant="danger"
          className="pr-msg"
          dismissible
          onClose={() => setError(null)}
        >
          <IconAlertTriangle size={20} />
          <span>{error}</span>
        </Alert>
      )}

      <Card className="card-lg mb-6 pr-card">
        <div className="pr-toolbar border-bottom">
          {/* Bagian 1: tab kategori (kiri) + jumlah data (kanan) */}
          <div className="pr-sec pr-sec-top">
            <div className="pa-tabs" role="tablist" aria-label="Kategori peminjam">
              <button
                type="button"
                role="tab"
                aria-selected={kategoriTab === "Internal"}
                className={`pa-tab-btn ${kategoriTab === "Internal" ? "active" : ""}`}
                onClick={() => setKategoriTab("Internal")}
              >
                Internal PLN
                <span className="pa-tab-n">{jumlahPerKategori.Internal}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={kategoriTab === "Vendor"}
                className={`pa-tab-btn ${kategoriTab === "Vendor" ? "active" : ""}`}
                onClick={() => setKategoriTab("Vendor")}
              >
                Eksternal / Vendor
                <span className="pa-tab-n">{jumlahPerKategori.Vendor}</span>
              </button>
            </div>

            <span className="pr-info">
              Menampilkan <b>{filteredList.length}</b> data {kategoriTab}
            </span>
          </div>

          {/* Bagian 2: pencarian */}
          <div className="pr-sec pr-sec-search">
            <InputGroup className="riwayat-search">
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder={`Cari riwayat peminjaman ${kategoriTab.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari riwayat peminjaman"
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
          </div>

          {/* Bagian 3: Filter Tanggal/Nama + Export PDF/Excel */}
          <div className="pr-sec pr-sec-filter">
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
        </div>

        <CardBody className="pr-body">
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : riwayatList.length === 0 ? (
            /* Empty state: belum ada riwayat sama sekali */
            <div className="pr-empty text-center py-6">
              <div className="pr-empty-icon mb-3">
                <IconHistory size={32} />
              </div>
              <h5 className="mb-1">Belum ada riwayat peminjaman</h5>
              <p className="text-secondary mb-0">
                Transaksi peminjaman yang sudah dikembalikan akan muncul di sini.
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            /* Empty state: hasil pencarian / filter kosong */
            <div className="pr-empty is-filter text-center py-6">
              <div className="pr-empty-icon mb-3">
                <IconFilterOff size={32} />
              </div>
              <h5 className="mb-1">Tidak ada data yang cocok</h5>
              <p className="text-secondary mb-0">
                Tidak ada riwayat peminjaman untuk kategori <b>{kategoriTab}</b>
                {searchTerm || tanggalFilter || namaFilter ? " yang cocok dengan filter Anda." : "."}
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

      <DetailTransaksiModal
        show={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        items={detailGroupItems}
      />
    </div>
  );
};

export default RiwayatPeminjamanManager;