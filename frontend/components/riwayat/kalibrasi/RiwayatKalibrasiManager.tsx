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
  IconFileTypePdf,
  IconFileSpreadsheet,
} from "@tabler/icons-react";

import { RiwayatKalibrasiType } from "types/RiwayatTypes";
import { exportToExcel, exportToPDF, ExportColumn } from "components/riwayat/common/exportUtils";
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";

import { getRiwayatKalibrasiColumns } from "./ColumnDefination";
import KalibrasiFormModal, { KalibrasiFormValues } from "./KalibrasiFormModal";

import {
  getRiwayatKalibrasi,
  createRiwayatKalibrasi,
  updateRiwayatKalibrasi,
  getStatusKalibrasi,
} from "services/riwayatKalibrasiService";

// Warna tema PLN
const NAVY = "#06355f";
const BLUE = "#0b6bb8";
const YELLOW = "#ffc20e";
const LINE = "#dbe5f1";

// ---------- Export PDF & Excel ----------
const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Kode Alat", key: "kodeAlat" },
  { header: "Nama Alat", key: "namaAlat" },
  { header: "Tanggal Kalibrasi", key: "tanggalKalibrasi" },
  { header: "Jatuh Tempo", key: "tanggalJatuhTempo" },
  { header: "Status", key: "status" },
  { header: "Hasil", key: "kondisi" },
  { header: "Pelaksana", key: "pelaksana" },
  { header: "Keterangan", key: "keterangan" },
];

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// "2026-10-07" / "2026-10-07T00:00:00Z" -> "07 Okt 2026" (tanpa konversi zona waktu)
const formatTanggal = (value?: string | null): string => {
  const m = value ? String(value).match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  return m ? `${m[3]} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : value ? String(value) : "-";
};

const STATUS_LABEL: Record<string, string> = {
  berlaku: "Berlaku",
  mendekati: "Mendekati jatuh tempo",
  lewat: "Lewat jatuh tempo",
};

const KONDISI_LABEL: Record<string, string> = {
  Baik: "Baik",
  RPP: "RPP (rusak, perlu perbaikan)",
  RT: "RT (rusak total)",
};

const RiwayatKalibrasiManager = () => {
  // Gunakan role aktual dari sesi login (sama seperti Data Pekerjaan).
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRole(localStorage.getItem("userRole"));
    } catch {
      setRole(null);
    }
  }, []);

  const normalizedRole = (role ?? "").trim().toLowerCase();
  const canManage = normalizedRole === "admin" || normalizedRole === "petugas";

  const [data, setData] = useState<RiwayatKalibrasiType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RiwayatKalibrasiType | null>(null);
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

  // ---------- Form: tambah & edit ----------
  const handleOpenForm = () => {
    if (!canManage) return;
    setFormError(null);
    setEditingItem(null); // mode tambah
    setFormModalOpen(true);
  };

  const handleOpenEdit = useCallback(
    (item: RiwayatKalibrasiType) => {
      if (!canManage) return;
      setFormError(null);
      setEditingItem(item); // mode edit
      setFormModalOpen(true);
    },
    [canManage]
  );

  const handleCloseForm = () => {
    setFormModalOpen(false);
    setEditingItem(null);
  };

  const columns = useMemo(
    () => getRiwayatKalibrasiColumns({ canManage, onEdit: handleOpenEdit }),
    [canManage, handleOpenEdit]
  );

  // ---------- Export PDF & Excel (memakai data yang sudah terfilter) ----------
  const buildExportRows = () =>
    filteredData.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = item as any;
      return {
        kodeAlat: item.kodeAlat,
        namaAlat: item.namaAlat,
        tanggalKalibrasi: formatTanggal(r.tanggalKalibrasiRaw ?? r.tanggalKalibrasi),
        tanggalJatuhTempo: formatTanggal(item.tanggalJatuhTempoRaw),
        status: STATUS_LABEL[getStatusKalibrasi(item.tanggalJatuhTempoRaw)] ?? "-",
        kondisi: KONDISI_LABEL[item.kondisi] ?? item.kondisi,
        pelaksana: item.pelaksana || "-",
        keterangan: r.keterangan || "-",
      };
    });

  const handleExportPDF = () =>
    exportToPDF(
      buildExportRows() as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS,
      "riwayat-kalibrasi",
      "Riwayat Kalibrasi Alat Ukur"
    );

  const handleExportExcel = () =>
    exportToExcel(
      buildExportRows() as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS,
      "riwayat-kalibrasi"
    );

  const handleSubmit = async (values: KalibrasiFormValues) => {
    if (!canManage) {
      setFormError("Role Viewer tidak memiliki akses mengubah riwayat kalibrasi.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        alatUkurId: values.alatUkurId,
        tanggalKalibrasi: values.tanggalKalibrasi,
        tanggalJatuhTempo: values.tanggalJatuhTempo || undefined,
        kondisi: values.kondisi,
        pelaksanaKalibrasi: values.pelaksanaKalibrasi || undefined,
        keterangan: values.keterangan || undefined,
        fileSertifikat: values.fileSertifikat ?? undefined,
      };

      if (editingItem) {
        await updateRiwayatKalibrasi(editingItem.id, payload);
        setSuccessMessage("Riwayat kalibrasi berhasil diperbarui.");
      } else {
        await createRiwayatKalibrasi(payload);
        setSuccessMessage("Riwayat kalibrasi berhasil dicatat.");
      }

      handleCloseForm();
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
          className="d-flex align-items-center gap-2 small"
          style={{ border: 0, borderRadius: 12 }}
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
          className="d-flex align-items-center gap-2 small"
          style={{ border: 0, borderRadius: 12 }}
          dismissible
          onClose={() => setError(null)}
        >
          <IconAlertTriangle size={20} />
          <span>{error}</span>
        </Alert>
      )}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2" style={{ fontWeight: 800, color: NAVY }}>
                Riwayat Kalibrasi
              </h1>
              <p className="text-secondary mb-2" style={{ maxWidth: 640 }}>
                Menampilkan riwayat kalibrasi seluruh alatukur beserta status jatuh temponya.
              </p>
              <DasherBreadcrumb />
            </div>
            {canManage && (
              <Button
                className="d-flex align-items-center gap-2"
                style={{
                  backgroundColor: YELLOW,
                  border: 0,
                  color: NAVY,
                  fontWeight: 700,
                }}
                onClick={handleOpenForm}
              >
                <IconPlus size={18} />
                Catat Kalibrasi Baru
              </Button>
            )}
          </Flex>
        </Col>
      </Row>

      <Card
        className="card-lg mb-6"
        style={{
          borderRadius: 16,
          border: `1px solid ${LINE}`,
          borderTop: `4px solid ${BLUE}`,
          overflow: "hidden",
        }}
      >
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

            <span className="riwayat-info text-secondary small ms-auto">
              Menampilkan <b style={{ color: NAVY }}>{filteredData.length}</b> dari {data.length} data
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

        <CardBody>
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-6">
              <div
                className="mx-auto mb-3"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "#e6f0fa",
                  color: BLUE,
                }}
              >
                <IconHistory size={32} />
              </div>
              <h5 className="mb-1" style={{ fontWeight: 800, color: NAVY }}>
                Belum ada riwayat kalibrasi
              </h5>
              <p className="text-secondary mb-0">
                {canManage
                  ? "Catat kalibrasi pertama lewat tombol di atas."
                  : "Riwayat kalibrasi belum dicatat oleh petugas."}
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-6">
              <div
                className="mx-auto mb-3"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "#fff8e1",
                  color: "#9a6a00",
                }}
              >
                <IconFilterOff size={32} />
              </div>
              <h5 className="mb-1" style={{ fontWeight: 800, color: NAVY }}>
                Tidak ada data yang cocok
              </h5>
              <p className="text-secondary mb-0">Coba ubah kata kunci atau filter status.</p>
            </div>
          ) : (
            <TanstackTable data={filteredData} columns={columns} pagination />
          )}
        </CardBody>
      </Card>

      {canManage && (
        <KalibrasiFormModal
          show={formModalOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={formError}
          initialData={editingItem}
        />
      )}
    </div>
  );
};

export default RiwayatKalibrasiManager;