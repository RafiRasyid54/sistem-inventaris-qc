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
} from "react-bootstrap";
import {
  IconSearch,
  IconX,
  IconCircleCheck,
  IconMoodEmpty,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react";

// import custom types
import { PeminjamanAktifItemType } from "types/DataAlatUkurTypes";

// import services / API fetch
import { getPeminjamanAktif } from "services/peminjamanService";

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
`;

const PeminjamanAktifManager = () => {
  const [data, setData] = useState<PeminjamanAktifItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
      setData([]); // Pastikan di-reset jadi array kosong agar tidak error saat difilter
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeminjamanAktif();
  }, [loadPeminjamanAktif]);

  const filteredData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter((item) => {
      return (
        item.kodeBarang?.toLowerCase().includes(keyword) ||
        item.namaBarang?.toLowerCase().includes(keyword) ||
        item.namaPeminjam?.toLowerCase().includes(keyword) ||
        item.peminjamId?.toLowerCase().includes(keyword)
      );
    });
  }, [data, searchTerm]);

  const columns = useMemo(() => getPeminjamanAktifColumns(), []);

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
        {/* ---- Toolbar: Search ---- */}
        <div className="riwayat-toolbar border-bottom pa-bar">
          <div className="riwayat-toolbar-row d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <InputGroup className="riwayat-search" style={{ maxWidth: "400px" }}>
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari kode alat, nama alat, peminjam..."
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
            <span className="riwayat-info pa-count">
              Menampilkan <b>{filteredData.length}</b> dari{" "}
              {Array.isArray(data) ? data.length : 0} data
            </span>
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
                Tidak ditemukan data yang cocok dengan kata kunci pencarian.
              </p>
              <Button
                variant="outline-secondary"
                className="d-inline-flex align-items-center gap-2"
                onClick={() => setSearchTerm("")}
              >
                <IconX size={18} />
                Reset pencarian
              </Button>
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
    </div>
  );
};

export default PeminjamanAktifManager;