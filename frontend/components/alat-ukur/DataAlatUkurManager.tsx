"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// =========================================================
// REACT BOOTSTRAP
// =========================================================

import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form,
} from "react-bootstrap";

// =========================================================
// ICON
// =========================================================

import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconTool,
  IconMoodEmpty,
} from "@tabler/icons-react";

// =========================================================
// CUSTOM COMPONENT
// =========================================================

import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";

import { ColumnDefinition } from "./ColumnDefination";
import { AlatUkurDetailModal } from "./AlatUkurDetailModal";
import { AlatUkurFormModal } from "./AlatUkurFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { CartFAB } from "./CartFAB";

// =========================================================
// API
// =========================================================

import apiFetch from "/lib/apiFetch";

// =========================================================
// TYPE
// =========================================================

import { AlatUkur } from "../../types/DataAlatUkurTypes";

// =========================================================
// RESPONSE API
// =========================================================

interface AlatUkurApiResponse {
  status: string;
  data: AlatUkur[];
}

// =========================================================
// COMPONENT
// =========================================================

const DataAlatUkurManager = () => {
  // =======================================================
  // STATE DATA
  // =======================================================

  const [data, setData] = useState<AlatUkur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =======================================================
  // SEARCH
  // =======================================================

  const [searchTerm, setSearchTerm] = useState("");

  // =======================================================
  // MODAL
  // =======================================================

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [activeAlatUkur, setActiveAlatUkur] =
    useState<AlatUkur | null>(null);

  // =======================================================
  // CART
  // =======================================================

  const [cart, setCart] = useState<AlatUkur[]>([]);

  // =======================================================
  // SUCCESS MESSAGE
  // =======================================================

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  // =======================================================
  // LOAD DATA
  // =======================================================

  const loadAlatUkur = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res =
        await apiFetch<AlatUkurApiResponse>(
          "/alat-ukur"
        );

      console.log(
        "Response alat ukur:",
        res
      );

      setData(res.data ?? []);
    } catch (err: any) {
      console.error(
        "Gagal memuat data alat ukur:",
        err
      );

      setError(
        err?.message ||
          "Gagal memuat data alat ukur."
      );

      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    loadAlatUkur();
  }, [loadAlatUkur]);

  // =======================================================
  // FILTER DATA
  // =======================================================

  const filteredData = useMemo(() => {
    const keyword =
      searchTerm.trim().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((item) => {
      const kodeAlat =
        item.kode_alat?.toLowerCase() || "";

      const namaAlat =
        item.nama_alat?.toLowerCase() || "";

      const merk =
        item.merk?.toLowerCase() || "";

      const sn =
        item.sn?.toLowerCase() || "";

      const spesifikasi =
        item.spesifikasi?.toLowerCase() || "";

      const kondisi =
        item.kondisi?.toLowerCase() || "";

      const keterangan =
        item.keterangan?.toLowerCase() || "";

      return (
        kodeAlat.includes(keyword) ||
        namaAlat.includes(keyword) ||
        merk.includes(keyword) ||
        sn.includes(keyword) ||
        spesifikasi.includes(keyword) ||
        kondisi.includes(keyword) ||
        keterangan.includes(keyword)
      );
    });
  }, [data, searchTerm]);

  // =======================================================
  // OPEN ADD MODAL
  // =======================================================

  const openAddModal = () => {
    setActiveAlatUkur(null);
    setFormModalOpen(true);
  };

  // =======================================================
  // OPEN EDIT MODAL
  // =======================================================

  const openEditModal = (
    item: AlatUkur
  ) => {
    setActiveAlatUkur(item);
    setFormModalOpen(true);
  };

  // =======================================================
  // OPEN DETAIL MODAL
  // =======================================================

  const openDetailModal = (
    item: AlatUkur
  ) => {
    setActiveAlatUkur(item);
    setDetailModalOpen(true);
  };

  // =======================================================
  // OPEN DELETE MODAL
  // =======================================================

  const openDeleteModal = (
    item: AlatUkur
  ) => {
    setActiveAlatUkur(item);
    setDeleteModalOpen(true);
  };

  // =======================================================
  // SAVE DATA
  // =======================================================

  const handleFormSubmit = async (
    formData: Partial<AlatUkur>
  ) => {
    try {
      setError(null);

      // ===================================================
      // EDIT DATA
      // ===================================================

      if (activeAlatUkur?.id) {
        await apiFetch(
          `/alat-ukur/${activeAlatUkur.id}`,
          {
            method: "PUT",
            body: JSON.stringify(formData),
          }
        );

        setSuccessMessage(
          "Data alat ukur berhasil diperbarui."
        );
      }

      // ===================================================
      // TAMBAH DATA
      // ===================================================

      else {
        await apiFetch(
          "/alat-ukur",
          {
            method: "POST",
            body: JSON.stringify(formData),
          }
        );

        setSuccessMessage(
          "Data alat ukur berhasil ditambahkan."
        );
      }

      // ===================================================
      // RESET MODAL
      // ===================================================

      setFormModalOpen(false);
      setActiveAlatUkur(null);

      // ===================================================
      // RELOAD DATA
      // ===================================================

      await loadAlatUkur();

      // ===================================================
      // HILANGKAN SUCCESS MESSAGE
      // ===================================================

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (err: any) {
      console.error(
        "Gagal menyimpan alat ukur:",
        err
      );

      setError(
        err?.message ||
          "Gagal menyimpan data alat ukur."
      );
    }
  };

  // =======================================================
  // DELETE DATA
  // =======================================================

  const handleConfirmDelete =
    async () => {
      if (!activeAlatUkur?.id) {
        return;
      }

      try {
        setError(null);

        await apiFetch(
          `/alat-ukur/${activeAlatUkur.id}`,
          {
            method: "DELETE",
          }
        );

        // =================================================
        // RESET MODAL
        // =================================================

        setDeleteModalOpen(false);
        setActiveAlatUkur(null);

        // =================================================
        // RELOAD DATA
        // =================================================

        await loadAlatUkur();

        // =================================================
        // SUCCESS
        // =================================================

        setSuccessMessage(
          "Data alat ukur berhasil dihapus."
        );

        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);

      } catch (err: any) {
        console.error(
          "Gagal menghapus alat ukur:",
          err
        );

        setError(
          err?.message ||
            "Gagal menghapus data alat ukur."
        );
      }
    };

  // =======================================================
  // ADD TO CART
  // =======================================================

  const handleAddToCart = useCallback(
    (item: AlatUkur) => {
      setCart((prevCart) => {
        const alreadyExists =
          prevCart.some(
            (cartItem) =>
              cartItem.id === item.id
          );

        if (alreadyExists) {
          return prevCart;
        }

        return [
          ...prevCart,
          item,
        ];
      });

      setSuccessMessage(
        `${item.nama_alat} berhasil ditambahkan ke keranjang.`
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    },
    []
  );

  // =======================================================
  // RESET SEARCH
  // =======================================================

  const handleResetSearch = () => {
    setSearchTerm("");
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="datatools-page">

      {/* ===================================================
          SUCCESS ALERT
      =================================================== */}

      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2"
          dismissible
          onClose={() =>
            setSuccessMessage(null)
          }
        >
          <IconCircleCheck size={20} />

          <span>
            {successMessage}
          </span>
        </Alert>
      )}

      {/* ===================================================
          ERROR ALERT
      =================================================== */}

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >

            {/* =============================================
                TITLE
            ============================================== */}

            <div>
              <h1 className="mb-2 h2">
                Data Alat Ukur
              </h1>

              <p className="text-secondary mb-0">
                Mengelola seluruh data alat ukur
                dan informasi kalibrasi.
              </p>

              <DasherBreadcrumb />
            </div>

            {/* =============================================
                ADD BUTTON
            ============================================== */}

            <div>
              <Button
                variant="primary"
                className="d-flex align-items-center gap-2"
                onClick={openAddModal}
              >
                <IconPlus size={18} />

                Tambah Data
              </Button>
            </div>

          </Flex>
        </Col>
      </Row>

      {/* ===================================================
          MAIN CARD
      =================================================== */}

      <Card className="card-lg mb-6">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="datatools-toolbar border-bottom">

          <Row className="g-2 align-items-center">

            {/* =============================================
                SEARCH
            ============================================== */}

            <Col lg={6} md={7}>
              <InputGroup className="datatools-search">

                <InputGroup.Text>
                  <IconSearch size={18} />
                </InputGroup.Text>

                <Form.Control
                  type="search"
                  placeholder="Cari kode, nama, merk, SN, kondisi..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                />

                {searchTerm && (
                  <Button
                    variant="link"
                    className="datatools-search-clear"
                    onClick={handleResetSearch}
                    aria-label="Reset pencarian"
                  >
                    <IconX size={16} />
                  </Button>
                )}

              </InputGroup>
            </Col>

            {/* =============================================
                COUNTER
            ============================================== */}

            <Col
              lg={6}
              md={5}
              className="text-md-end"
            >
              <span className="text-secondary small">

                Menampilkan{" "}

                <span className="fw-semibold text-body">
                  {filteredData.length}
                </span>

                {" "}dari{" "}

                <span className="fw-semibold text-body">
                  {data.length}
                </span>

                {" "}data

              </span>
            </Col>

          </Row>
        </div>

        {/* =================================================
            TABLE BODY
        ================================================= */}

        <CardBody>

          {/* ===============================================
              LOADING
          =============================================== */}

          {loading ? (

            <div className="text-center py-6">

              <Spinner
                animation="border"
                size="sm"
                className="me-2"
              />

              Memuat data alat ukur...

            </div>

          ) : data.length === 0 ? (

            /* =============================================
               EMPTY DATABASE
            ============================================== */

            <div className="datatools-empty text-center py-6">

              <div className="datatools-empty-icon mb-3">
                <IconTool size={32} />
              </div>

              <h5 className="mb-1">
                Belum ada data alat ukur
              </h5>

              <p className="text-secondary mb-4">
                Mulai dengan menambahkan
                alat ukur pertama.
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

          ) : filteredData.length === 0 ? (

            /* =============================================
               EMPTY SEARCH
            ============================================== */

            <div className="datatools-empty text-center py-6">

              <div className="datatools-empty-icon mb-3">
                <IconMoodEmpty size={32} />
              </div>

              <h5 className="mb-1">
                Tidak ada hasil
              </h5>

              <p className="text-secondary mb-4">
                Tidak ditemukan data alat ukur
                yang cocok dengan pencarian.
              </p>

              <Button
                variant="outline-secondary"
                className="d-inline-flex align-items-center gap-2"
                onClick={handleResetSearch}
              >
                <IconX size={18} />

                Reset Pencarian
              </Button>

            </div>

          ) : (

            /* =============================================
               TABLE

               ColumnDefinition adalah COMPONENT,
               bukan ColumnDef[] untuk TanstackTable.
            ============================================== */

            <ColumnDefinition
              items={filteredData}
              onDetail={openDetailModal}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onAddToCart={handleAddToCart}
            />

          )}

        </CardBody>

      </Card>

      {/* ===================================================
          FORM MODAL
      =================================================== */}

      <AlatUkurFormModal
        isOpen={formModalOpen}
        item={activeAlatUkur}
        onClose={() => {
          setFormModalOpen(false);
          setActiveAlatUkur(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* ===================================================
          DETAIL MODAL
      =================================================== */}

      <AlatUkurDetailModal
        item={
          detailModalOpen
            ? activeAlatUkur
            : null
        }
        onClose={() => {
          setDetailModalOpen(false);
          setActiveAlatUkur(null);
        }}
      />

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setActiveAlatUkur(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* ===================================================
          CART FAB
      =================================================== */}

      <CartFAB
        count={cart.length}
        onClick={() => {
          if (cart.length === 0) {
            alert(
              "Belum ada alat ukur yang dipilih."
            );
            return;
          }

          alert(
            `Proses peminjaman untuk ${cart.length} alat ukur.`
          );
        }}
      />

    </div>
  );
};

export default DataAlatUkurManager;