"use client";
import { useEffect, useMemo, useState } from "react";
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
  IconTruckDelivery,
  IconMoodEmpty,
} from "@tabler/icons-react";

import {
  AlatukurItemType,
  AlatukurMasukType,
  AlatukurMasukFormValues,
} from "types/DataAlatukurTypes";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import RiwayatFilterBar from "components/ruangalat ukur/riwayat/common/RiwayatFilterBar";
import {
  DateFilterValue,
  dateInFilter,
  parseRowDate,
} from "components/ruangalat ukur/common/dateUtils";
import { exportToExcel, exportToPDF, ExportColumn, getFilteredExportFileName } from "components/ruangalat ukur/riwayat/common/exportUtils";
import { getAlatukurMasukColumns } from "components/ruangalat ukur/alat ukurmasuk/ColumnDefination";
import AlatukurMasukFormModal from "components/ruangalat ukur/alat ukurmasuk/AlatukurMasukFormModal";
import DeleteConfirmModal from "components/ruangalat ukur/alat ukurmasuk/DeleteConfirmModal";

import { getAlatukur } from "services/alat Ukurervice";
import {
  getAlatukurMasuk,
  createAlatukurMasuk,
  updateAlatukurMasuk,
  deleteAlatukurMasuk,
} from "services/alat ukurMasukService";

// IMPORT INI UNTUK VALIDASI ROLE
import { getPemintaAktif } from "services/pemintaService";

const AlatukurMasukManager = () => {
  const [alat ukur, setAlatukur] = useState<AlatukurItemType[]>([]);
  const [loadingAlatukur, setLoadingAlatukur] = useState(true);

  const [masukList, setMasukList] = useState<AlatukurMasukType[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<AlatukurMasukType | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Alatukurbar: pencarian (murni UI, tidak menyentuh API/data) ----
  const [searchTerm, setSearchTerm] = useState("");
  const [tanggalFilter, setTanggalFilter] = useState<DateFilterValue | null>(null);
  const [namaFilter, setNamaFilter] = useState("");

  const getNamaPencatat = (item: AlatukurMasukType) =>
    item.dicatatOleh?.name || "Tidak diketahui";

  const EXPORT_COLUMNS: ExportColumn[] = [
    { header: "Tanggal", key: "tanggal" }, { header: "Kode Barang", key: "kode_barang" },
    { header: "Nama Barang", key: "nama_barang" }, { header: "Jumlah Masuk", key: "jumlah_masuk" },
    { header: "Pencatat", key: "nama_pencatat" }, { header: "Keterangan", key: "keterangan" },
  ];

  // Data turunan untuk tampilan; sumber data (masukList) tidak diubah.
  // Data turunan untuk tampilan; sumber data (masukList) tidak diubah.
  const filteredMasukList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    
    return masukList.filter((item) => {
      // 1. Filter tanggal (rentang atau satu bulan)
      let cocokTanggal = true;
      if (tanggalFilter) {
        const date = parseRowDate(item.tanggal);
        cocokTanggal = !date || dateInFilter(date, tanggalFilter);
      }
        
      // 2. Filter nama pencatat (dari dropdown)
      const cocokNama = namaFilter === "" || getNamaPencatat(item) === namaFilter;
      
      // 3. Filter pencarian teks (mencakup SEMUA kolom di tabel + Null-Safety)
      let cocokKeyword = true;
      if (keyword !== "") {
        const tanggalStr = (item.tanggal || "").toLowerCase();
        const kodeBarang = (item.kode_barang || "").toLowerCase();
        const namaBarang = (item.nama_barang || "").toLowerCase();
        const merk = (item.merk || "").toLowerCase();
        const tipe = (item.tipe || "").toLowerCase();
        // Menggunakan (item as any) untuk jaga-jaga jika warna/ukuran adalah properti bawaan dari relasi tabel alat ukur
        const warna = ((item as any).warna || "").toLowerCase();
        const ukuran = ((item as any).ukuran || "").toLowerCase();
        const jumlahMasuk = String(item.jumlah_masuk ?? 0);
        const namaPencatat = getNamaPencatat(item).toLowerCase();
        const keterangan = (item.keterangan || "").toLowerCase();

        cocokKeyword =
          tanggalStr.includes(keyword) ||
          kodeBarang.includes(keyword) ||
          namaBarang.includes(keyword) ||
          merk.includes(keyword) ||
          tipe.includes(keyword) ||
          warna.includes(keyword) ||
          ukuran.includes(keyword) ||
          jumlahMasuk.includes(keyword) ||
          namaPencatat.includes(keyword) ||
          keterangan.includes(keyword);
      }

      return cocokTanggal && cocokNama && cocokKeyword;
    });
  }, [masukList, searchTerm, tanggalFilter, namaFilter]);

  const namaOptions = useMemo(() => Array.from(new Set(masukList.map(getNamaPencatat))).sort(), [masukList]);
  const exportRows = useMemo(() => filteredMasukList.map((item) => ({
    ...item,
    nama_pencatat: getNamaPencatat(item),
  })), [filteredMasukList]);
  const getExportName = () => getFilteredExportFileName("Alatukur_Masuk", namaFilter);
  const handleExportPdf = () => exportToPDF(exportRows, EXPORT_COLUMNS, getExportName(), "Alatukur Masuk");
  const handleExportExcel = () => exportToExcel(exportRows, EXPORT_COLUMNS, getExportName(), "Alatukur Masuk");

  const loadAlatukur = async () => {
    setLoadingAlatukur(true);
    try {
      const data = await getAlatukur();
      setAlatukur(data);
    } catch {
      setErrorMsg("Gagal memuat data alat untuk pilihan Kode Barang.");
    } finally {
      setLoadingAlatukur(false);
    }
  };

  const loadMasukList = async () => {
    setLoadingList(true);
    try {
      const data = await getAlatukurMasuk();
      setMasukList(data);
    } catch {
      setErrorMsg("Gagal memuat riwayat alat masuk.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAlatukur();
    loadMasukList();
  }, []);

  const openAddModal = () => {
    setActiveItem(null);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: AlatukurMasukType) => {
    setActiveItem(item);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openDeleteModal = (item: AlatukurMasukType) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (values: AlatukurMasukFormValues & { peminta_id?: string }) => {
    setFormError(null);
    try {
      if (activeItem) {
        const updated = await updateAlatukurMasuk(activeItem.id, {
          tanggal: values.tanggal,
          jumlah_masuk: values.jumlah_masuk,
          keterangan: values.keterangan,
        });
        setMasukList((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
        await loadAlatukur();
      } else {
        // 1. Pastikan id_card atau peminta_id terisi dari hasil tap kartu
        const idCardValue = values.peminta_id || values.id_card;
        if (!idCardValue) {
          throw new Error("ID Card wajib di-tap untuk verifikasi.");
        }

        // 2. VALIDASI ROLE SEBELUM SUBMIT
        const pegawaiAktif = await getPemintaAktif();
        const pegawaiTerkait = pegawaiAktif.find((p) => p.id === idCardValue);

        if (!pegawaiTerkait) {
          throw new Error("Pegawai dengan ID tersebut tidak ditemukan atau sedang tidak aktif.");
        }

        if (pegawaiTerkait.role !== "inventory man") {
          throw new Error("Akses Ditolak! Hanya Inventory Man yang boleh menginput stok Alatukur Masuk.");
        }

        // 3. Panggil fungsi create dengan memastikan peminta_id terkirim eksplisit
        const created = await createAlatukurMasuk({
          ...values,
          peminta_id: idCardValue,
        });

        setMasukList((prev) => [created, ...prev]);

        // refresh Data Alatukur supaya stok yang tampil di halaman lain akurat
        await loadAlatukur();

        setSuccessMessage(
          `Berhasil menambah ${values.jumlah_masuk} unit "${values.nama_barang}" ke Data Alatukur.`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      setFormModalOpen(false);
      setActiveItem(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      setFormError(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteAlatukurMasuk(activeItem.id);
      setMasukList((prev) => prev.filter((m) => m.id !== activeItem.id));
      // stok Data Alatukur otomatis disesuaikan balik oleh backend,
      // refresh supaya halaman lain (Data Alatukur) tetap akurat
      await loadAlatukur();
    } catch {
      setErrorMsg("Gagal menghapus data alat ukur masuk.");
    } finally {
      setDeleteModalOpen(false);
      setActiveItem(null);
    }
  };

  const columns = useMemo(
    () =>
      getAlatukurMasukColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    []
  );

  return (
    <div className="alat ukurmasuk-page">
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
      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

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
              <h1 className="mb-2 h2">Alatukur Masuk</h1>
              <p className="text-secondary mb-0">
                Mencatat alat yang masuk.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
                onClick={openAddModal}
                disabled={loadingAlatukur}
              >
                <IconPlus size={18} />
                Tambah
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        {/* ---- Alatukurbar: Search ---- */}
        <div className="riwayat-alat ukurbar border-bottom">
          <div className="riwayat-alat ukurbar-row">
            <InputGroup className="riwayat-search">
              <InputGroup.Text>
                <IconSearch size={18} />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari kode, nama, atau informasi lainnya..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari alat ukur masuk"
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
              <span className="fw-semibold text-body">{filteredMasukList.length}</span>{" "}
              dari {masukList.length} data
            </span>
          </div>
          <RiwayatFilterBar
            tanggalFilter={tanggalFilter}
            onTanggalFilterChange={setTanggalFilter}
            namaFilter={namaFilter}
            onNamaFilterChange={setNamaFilter}
            namaOptions={namaOptions}
            namaLabel="Pencatat"
            onExportPDF={handleExportPdf}
            onExportExcel={handleExportExcel}
          />
        </div>

        <CardBody>
          {loadingList ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" />
              Memuat data...
            </div>
          ) : masukList.length === 0 ? (
            /* Empty state: belum ada catatan */
            <div className="alat ukurmasuk-empty text-center py-6">
              <div className="alat ukurmasuk-empty-icon mb-3">
                <IconTruckDelivery size={32} />
              </div>
              <h5 className="mb-1">Belum ada catatan alat masuk</h5>
              <p className="text-secondary mb-4">
                Mulai mencatat penambahan stok alat dengan menekan tombol Tambah.
              </p>
              <Button
                variant="primary"
                className="d-inline-flex align-items-center gap-2"
                onClick={openAddModal}
                disabled={loadingAlatukur}
              >
                <IconPlus size={18} />
                Tambah
              </Button>
            </div>
          ) : filteredMasukList.length === 0 ? (
            /* Empty state: hasil pencarian kosong */
            <div className="alat ukurmasuk-empty text-center py-6">
              <div className="alat ukurmasuk-empty-icon mb-3">
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
              data={filteredMasukList}
              columns={columns}
              pagination
            />
          )}
        </CardBody>
      </Card>

      <AlatukurMasukFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveItem(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeItem}
        alat ukurOptions={alat ukur}
        error={formError}
      />
      <DeleteConfirmModal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        item={activeItem}
      />

      {loadingAlatukur && (
        <div
          className="position-fixed bottom-0 end-0 m-4 bg-white shadow rounded-3 px-3 py-2 d-flex align-items-center gap-2"
          style={{ zIndex: 1050 }}
        >
          <Spinner animation="border" size="sm" />
          <span className="small text-secondary">Memuat data alat...</span>
        </div>
      )}
    </div>
  );
};

export default AlatukurMasukManager;