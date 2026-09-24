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
  IconClipboardList,
  IconMoodEmpty,
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
    <div className="peminjamanaktif-page position-relative pb-6">
      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Peminjaman Aktif</h1>
              <p className="text-secondary mb-0">
                Daftar alat ukur yang sedang dipinjam beserta informasi peminjamnya.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        {/* ---- Toolbar: Search ---- */}
        <div className="riwayat-toolbar border-bottom p-3">
          <div className="riwayat-toolbar-row d-flex justify-content-between align-items-center">
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
            <span className="riwayat-info text-secondary small">
              Menampilkan{" "}
              <span className="fw-semibold text-body">{filteredData.length}</span>{" "}
              dari {Array.isArray(data) ? data.length : 0} data
            </span>
          </div>
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data peminjaman aktif...
            </div>
          ) : !Array.isArray(data) || data.length === 0 ? (
            <div className="peminjamanaktif-empty text-center py-6">
              <div className="peminjamanaktif-empty-icon mb-3">
                <IconClipboardList size={32} />
              </div>
              <h5 className="mb-1">Tidak ada peminjaman aktif</h5>
              <p className="text-secondary mb-0">
                Saat ini tidak ada alat ukur yang sedang dipinjam.
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="peminjamanaktif-empty text-center py-6">
              <div className="peminjamanaktif-empty-icon mb-3">
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
                Reset Pencarian
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