"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Alert,
  Spinner,
  InputGroup,
  Form,
} from "react-bootstrap";
import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconUsers,
  IconMoodEmpty,
} from "@tabler/icons-react";

import { PeminjamType } from "types/DataAlatUkurTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getPeminjamColumns } from "components/datapeminjam/ColumnDefination";
import PeminjamFormModal, { PeminjamFormValues } from "components/datapeminjam/PeminjamFormModal";
import DeleteConfirmModal from "components/datapeminjam/DeleteConfirmModal";
import { exportToExcel, exportToPDF, ExportColumn } from "../riwayat/common/exportUtils";

import {
  getPeminta,
  createPeminta,
  updatePeminta,
  nonaktifkanPeminta,
  aktifkanPeminta,
  updateRolePeminta,
} from "services/pemintaService";

function sortByNama(items: PeminjamType[]): PeminjamType[] {
  return [...items].sort((a, b) => {
    if (a.aktif !== b.aktif) {
      return a.aktif ? -1 : 1;
    }
    return (a.nama || "").localeCompare(b.nama || "");
  });
}

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Nama", key: "nama" },
  { header: "Divisi", key: "divisi" },
  { header: "RFID UID", key: "id" },
  { header: "Status", key: "statusLabel" },
];

const PeminjamManager = () => {
  const canManage = true; // Diatur true langsung sesuai permintaan

  const [peminjamList, setPeminjamList] = useState<PeminjamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PeminjamType | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPeminjam = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return peminjamList;

    return peminjamList.filter((item) => {
      const nama = item.nama?.toLowerCase() ?? "";
      const divisi = item.divisi?.toLowerCase() ?? "";
      const rfid = item.id?.toLowerCase() ?? "";
      const rawRole = item.role?.toLowerCase() ?? "";
      const role = rawRole === "user" ? "pekerja" : rawRole;
      const status = item.aktif ? "aktif" : "nonaktif";

      return (
        nama.includes(keyword) ||
        divisi.includes(keyword) ||
        role.includes(keyword) ||
        rfid.includes(keyword) ||
        status.includes(keyword)
      );
    });
  }, [peminjamList, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeminta();
      setPeminjamList(sortByNama(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data peminjam";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = useCallback(() => {
    setActiveItem(null);
    setFormError(null);
    setFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((item: PeminjamType) => {
    setActiveItem(item);
    setFormError(null);
    setFormModalOpen(true);
  }, []);

  const openDeleteModal = useCallback((item: PeminjamType) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  }, []);

  const handleFormSubmit = async (values: PeminjamFormValues) => {
    setFormError(null);
    try {
      if (activeItem) {
        const updated = await updatePeminta(activeItem.id, values);
        setPeminjamList((prev) =>
          sortByNama(prev.map((p) => (p.id === updated.id ? updated : p)))
        );
      } else {
        const created = await createPeminta(values);
        setPeminjamList((prev) => sortByNama([created, ...prev]));
      }
      setFormModalOpen(false);
      setActiveItem(null);
    } catch (err: any) {
      const message = err?.message || "Gagal menyimpan data";
      setFormError(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    setDeleting(true);
    try {
      const updated = await nonaktifkanPeminta(activeItem.id);
      setPeminjamList((prev) =>
        sortByNama(prev.map((p) => (p.id === updated.id ? updated : p)))
      );
      setDeleteModalOpen(false);
      setActiveItem(null);
      setSuccessMessage(`${updated.nama} berhasil dinonaktifkan.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err?.message || "Gagal menonaktifkan data");
    } finally {
      setDeleting(false);
    }
  };

  const handleAktifkan = useCallback(async (item: PeminjamType) => {
    setTogglingId(item.id);
    try {
      const updated = await aktifkanPeminta(item.id);
      setPeminjamList((prev) =>
        sortByNama(prev.map((p) => (p.id === updated.id ? updated : p)))
      );
      setSuccessMessage(`${updated.nama} berhasil diaktifkan kembali.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err?.message || "Gagal mengaktifkan data");
    } finally {
      setTogglingId(null);
    }
  }, []);

  const handleGantiRole = useCallback(async (item: PeminjamType, roleBaru: "user" | "inventory man") => {
    try {
      const updated = await updateRolePeminta(item.id, roleBaru);
      setPeminjamList((prev) =>
        sortByNama(prev.map((p) => (p.id === updated.id ? updated : p)))
      );
      const roleName = roleBaru === "inventory man" ? "Inventory Man" : "Pekerja";
      setSuccessMessage(`Role ${updated.nama} berhasil diubah menjadi ${roleName}.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err?.message || "Gagal mengubah role");
    }
  }, []);

  const buildExportData = () =>
    peminjamList.map((item) => ({
      ...item,
      statusLabel: item.aktif ? "Aktif" : "Nonaktif",
    }));

  const handleExportPDF = () => {
    exportToPDF(
      buildExportData() as Record<string, unknown>[],
      EXPORT_COLUMNS,
      "data-peminjam",
      "Data Peminjam"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      buildExportData() as Record<string, unknown>[],
      EXPORT_COLUMNS,
      "data-peminjam"
    );
  };

  const columns = useMemo(
    () =>
      getPeminjamColumns({
        canManage,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onAktifkan: handleAktifkan,
        onGantiRole: handleGantiRole,
        togglingId,
      }),
    [togglingId, canManage, openEditModal, openDeleteModal, handleAktifkan, handleGantiRole]
  );

  return (
    <div className="datapeminjam-page">
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
              <h1 className="mb-2 h2">Data Peminjam</h1>
              <p className="text-secondary mb-0">
                Mengelola daftar pegawai yang dapat meminjam alat atau mengambil bahan.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} />
                Tambah Data
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <div className="datapeminjam-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={5} md={6}>
              <InputGroup className="datapeminjam-search">
                <InputGroup.Text>
                  <IconSearch size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari nama, divisi, atau informasi lainnya..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Cari data peminjam"
                />
                {searchTerm && (
                  <Button
                    variant="link"
                    className="datapeminjam-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Bersihkan pencarian"
                  >
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={4} md={3} className="text-md-end">
              <span className="text-secondary small">
                Menampilkan{" "}
                <span className="fw-semibold text-body">{filteredPeminjam.length}</span>{" "}
                dari {peminjamList.length} data
              </span>
            </Col>
            <Col lg={3} md={3} className="d-flex justify-content-md-end gap-2">
              <Button variant="outline-danger" size="sm" onClick={handleExportPDF}>
                Export PDF
              </Button>
              <Button variant="outline-success" size="sm" onClick={handleExportExcel}>
                Export Excel
              </Button>
            </Col>
          </Row>
        </div>

        <CardBody>
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : peminjamList.length === 0 ? (
            <div className="datapeminjam-empty text-center py-6">
              <div className="datapeminjam-empty-icon mb-3">
                <IconUsers size={32} />
              </div>
              <h5 className="mb-1">Belum ada data peminjam</h5>
              <p className="text-secondary mb-4">
                Mulai dengan menambahkan pegawai yang dapat meminjam alat atau mengambil bahan.
              </p>
              <Button
                variant="primary"
                className="d-inline-flex align-items-center gap-2"
                onClick={openAddModal}
              >
                <IconPlus size={18} />
                Tambah Data
              </Button>
            </div>
          ) : filteredPeminjam.length === 0 ? (
            <div className="datapeminjam-empty text-center py-6">
              <div className="datapeminjam-empty-icon mb-3">
                <IconMoodEmpty size={32} />
              </div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">
                Tidak ditemukan data yang cocok dengan pencarian.
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
              data={filteredPeminjam}
              columns={columns}
              pagination
            />
          )}
        </CardBody>
      </Card>

      <PeminjamFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveItem(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeItem}
        error={formError}
      />
      
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        peminjam={activeItem}
        submitting={deleting}
      />
    </div>
  );
};

export default PeminjamManager;