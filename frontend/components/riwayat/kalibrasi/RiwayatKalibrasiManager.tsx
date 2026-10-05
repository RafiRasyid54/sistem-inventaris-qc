"use client";
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
  IconHistory,
  IconSearch,
  IconX,
  IconPlus,
  IconCircleCheck,
  IconAlertTriangle,
  IconFilterOff,
} from "@tabler/icons-react";

import { RiwayatKalibrasiType } from "types/RiwayatTypes";
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";

import { getRiwayatKalibrasiColumns } from "./ColumnDefination";
import KalibrasiFormModal, { KalibrasiFormValues } from "./KalibrasiFormModal";

import {
  getRiwayatKalibrasi,
  createRiwayatKalibrasi,
  getStatusKalibrasi,
} from "services/riwayatKalibrasiService";

// Gaya halaman Riwayat Kalibrasi (tema PLN). Semua selector diawali .pln-rk.
const CSS = `
.pln-rk{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--line:#dbe5f1;--mute:#62708a}
.pln-rk .btn-yellow{background:var(--yellow);border:0;color:var(--navy);font-weight:700}
.pln-rk .btn-yellow:hover,.pln-rk .btn-yellow:focus{background:var(--yellow);color:var(--navy);filter:brightness(1.06)}
.pln-rk .rk-head h1{font-weight:800;color:var(--navy)}
.pln-rk .rk-head p{max-width:640px}

/* pesan */
.pln-rk .rk-msg{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.88rem}

/* kartu tabel */
.pln-rk .rk-card{border-radius:16px;border:1px solid var(--line);border-top:4px solid var(--blue);overflow:hidden}
.pln-rk .rk-card .form-control:focus,.pln-rk .rk-card .form-select:focus{
  border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-rk .rk-info b{color:var(--navy)}

/* tabel */
.pln-rk .rk-card table thead th{background:#eef3f9;color:var(--navy);font-size:.76rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.02em;border-bottom:1px solid var(--line)}
.pln-rk .rk-card table tbody tr:hover>*{background:#f6f9fc}
.pln-rk .rk-card .page-item.active .page-link{background:var(--blue);border-color:var(--blue);color:#fff}
.pln-rk .rk-card .page-link{color:var(--navy)}

/* empty state */
.pln-rk .rk-empty-icon{width:72px;height:72px;border-radius:50%;margin:0 auto;display:grid;place-items:center;
  background:#e6f0fa;color:var(--blue)}
.pln-rk .rk-empty.is-filter .rk-empty-icon{background:#fff8e1;color:#9a6a00}
.pln-rk .rk-empty h5{font-weight:800;color:var(--navy)}
`;

const RiwayatKalibrasiManager = () => {
  const [data, setData] = useState<RiwayatKalibrasiType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRiwayatKalibrasi();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat riwayat kalibrasi";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return data.filter((item) => {
      if (statusFilter && getStatusKalibrasi(item.tanggalJatuhTempoRaw) !== statusFilter) {
        return false;
      }
      if (!keyword) return true;

      return (
        item.kodeAlat.toLowerCase().includes(keyword) ||
        item.namaAlat.toLowerCase().includes(keyword) ||
        item.pelaksana.toLowerCase().includes(keyword) ||
        item.kondisi.toLowerCase().includes(keyword)
      );
    });
  }, [data, searchTerm, statusFilter]);

  const columns = useMemo(() => getRiwayatKalibrasiColumns(), []);

  const handleSubmit = async (values: KalibrasiFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await createRiwayatKalibrasi({
        alatUkurId: values.alatUkurId,
        tanggalKalibrasi: values.tanggalKalibrasi,
        tanggalJatuhTempo: values.tanggalJatuhTempo || undefined,
        kondisi: values.kondisi,
        pelaksanaKalibrasi: values.pelaksanaKalibrasi || undefined,
        keterangan: values.keterangan || undefined,
      });
      setFormModalOpen(false);
      setSuccessMessage("Riwayat kalibrasi berhasil dicatat.");
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Gagal menyimpan riwayat kalibrasi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="riwayat-page riwayat-kalibrasi-page pln-rk">
      <style>{CSS}</style>

      {successMessage && (
        <Alert
          variant="success"
          className="rk-msg"
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
          className="rk-msg"
          dismissible
          onClose={() => setError(null)}
        >
          <IconAlertTriangle size={20} />
          <span>{error}</span>
        </Alert>
      )}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100 rk-head" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Riwayat Kalibrasi</h1>
              <p className="text-secondary mb-2">
                Menampilkan riwayat kalibrasi seluruh alat ukur beserta status jatuh temponya.
              </p>
              <DasherBreadcrumb />
            </div>
            <Button
              className="btn-yellow d-flex align-items-center gap-2"
              onClick={() => {
                setFormError(null);
                setFormModalOpen(true);
              }}
            >
              <IconPlus size={18} />
              Catat Kalibrasi Baru
            </Button>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6 rk-card">
        <div className="riwayat-toolbar border-bottom p-3">
          <div className="riwayat-toolbar-row d-flex flex-wrap align-items-center gap-2">
            <InputGroup className="riwayat-search" style={{ maxWidth: "320px" }}>
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari kode, nama alat, atau pelaksana..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari riwayat kalibrasi"
              />
              {searchTerm && (
                <Button
                  variant="link"
                  onClick={() => setSearchTerm("")}
                  aria-label="Bersihkan pencarian"
                >
                  <IconX size={16} />
                </Button>
              )}
            </InputGroup>

            <Form.Select
              style={{ maxWidth: "200px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status kalibrasi"
            >
              <option value="">Semua status</option>
              <option value="berlaku">Berlaku</option>
              <option value="mendekati">Mendekati jatuh tempo</option>
              <option value="lewat">Lewat jatuh tempo</option>
            </Form.Select>

            <span className="riwayat-info rk-info text-secondary small ms-auto">
              Menampilkan <b>{filteredData.length}</b> dari {data.length} data
            </span>
          </div>
        </div>

        <CardBody>
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : data.length === 0 ? (
            <div className="rk-empty text-center py-6">
              <div className="rk-empty-icon mb-3">
                <IconHistory size={32} />
              </div>
              <h5 className="mb-1">Belum ada riwayat kalibrasi</h5>
              <p className="text-secondary mb-0">Catat kalibrasi pertama lewat tombol di atas.</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="rk-empty is-filter text-center py-6">
              <div className="rk-empty-icon mb-3">
                <IconFilterOff size={32} />
              </div>
              <h5 className="mb-1">Tidak ada data yang cocok</h5>
              <p className="text-secondary mb-0">Coba ubah kata kunci atau filter status.</p>
            </div>
          ) : (
            <TanstackTable data={filteredData} columns={columns} pagination />
          )}
        </CardBody>
      </Card>

      <KalibrasiFormModal
        show={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={formError}
      />
    </div>
  );
};

export default RiwayatKalibrasiManager;