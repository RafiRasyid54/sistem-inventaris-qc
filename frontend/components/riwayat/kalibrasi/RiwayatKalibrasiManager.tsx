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
import { IconHistory, IconSearch, IconX, IconPlus, IconCircleCheck } from "@tabler/icons-react";

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
    <div className="riwayat-page riwayat-kalibrasi-page">
      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Riwayat Kalibrasi</h1>
              <p className="text-secondary mb-0">
                Menampilkan riwayat kalibrasi seluruh alat ukur beserta status jatuh temponya.
              </p>
              <DasherBreadcrumb />
            </div>
            <Button
              variant="primary"
              className="d-flex align-items-center gap-2"
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

      <Card className="card-lg mb-6">
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
              />
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm("")}>
                  <IconX size={16} />
                </Button>
              )}
            </InputGroup>

            <Form.Select
              style={{ maxWidth: "200px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua status</option>
              <option value="berlaku">Berlaku</option>
              <option value="mendekati">Mendekati jatuh tempo</option>
              <option value="lewat">Lewat jatuh tempo</option>
            </Form.Select>

            <span className="riwayat-info text-secondary small ms-auto">
              Menampilkan <span className="fw-semibold text-body">{filteredData.length}</span> dari {data.length} data
            </span>
          </div>
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : data.length === 0 ? (
            <div className="riwayat-empty text-center py-6">
              <div className="riwayat-empty-icon mb-3">
                <IconHistory size={32} />
              </div>
              <h5 className="mb-1">Belum ada riwayat kalibrasi</h5>
              <p className="text-secondary mb-0">Catat kalibrasi pertama lewat tombol di atas.</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="riwayat-empty text-center py-6">
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