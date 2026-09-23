"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Modal,
  Badge,
} from "react-bootstrap";

import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconTool,
  IconMoodEmpty,
  IconId,
  IconUserCheck,
  IconLogout,
} from "@tabler/icons-react";

import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";

import { ColumnDefinition } from "./ColumnDefination";
import { AlatUkurDetailModal } from "./AlatUkurDetailModal";
import { AlatUkurFormModal } from "./AlatUkurFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import LoanFormModal from "components/common/LoanFormModal"; 
import { CartFAB } from "./CartFAB";

import apiFetch from "/lib/apiFetch";
import { AlatUkur } from "../../types/DataAlatUkurTypes";

interface AlatUkurApiResponse {
  status: string;
  data: AlatUkur[];
}

const DataAlatUkurManager = () => {
  const [data, setData] = useState<AlatUkur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false); 
  
  // =======================================================
  // ALUR UTAMA: PEMINJAM HARUS SCAN KARTU DI AWAL
  // =======================================================
  const [peminjamAktif, setPeminjamAktif] = useState<any>(null);
  const [scanCardModalOpen, setScanCardModalOpen] = useState(false);
  const [rfidInputBuffer, setRfidInputBuffer] = useState("");
  const [isVerifyingCard, setIsVerifyingCard] = useState(false);

  const [activeAlatUkur, setActiveAlatUkur] = useState<AlatUkur | null>(null);
  const [cart, setCart] = useState<AlatUkur[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAlatUkur = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<AlatUkurApiResponse>("/alat-ukur");
      setData(res.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data alat ukur.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlatUkur();
  }, [loadAlatUkur]);

  // Listener untuk tangkap USB RFID Reader saat modal scan kartu terbuka
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scanCardModalOpen) return;

      if (e.key === "Enter") {
        if (rfidInputBuffer.trim() !== "") {
          verifyCard(rfidInputBuffer.trim());
          setRfidInputBuffer("");
        }
      } else {
        setRfidInputBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scanCardModalOpen, rfidInputBuffer]);

 const verifyCard = async (rfidCode: string) => {
    try {
      setIsVerifyingCard(true);
      setError(null);

      const res = await apiFetch<any>(`/peminta?rfid=${rfidCode}`);
      
      // Cek isi data yang dikembalikan oleh backend di Console (F12)
      console.log("RESPONSE API PEMINTA:", res);

      let pemintaData = null;
      if (Array.isArray(res)) {
        pemintaData = res[0];
      } else if (res?.data && Array.isArray(res.data)) {
        pemintaData = res.data[0];
      } else if (res?.data) {
        pemintaData = res.data;
      } else {
        pemintaData = res;
      }

      if (pemintaData) {
        setPeminjamAktif(pemintaData);
        
        const namaPeminjam = pemintaData.nama || pemintaData.nama_peminta || pemintaData.name || pemintaData.username || pemintaData.nama_lengkap || "Pengguna";
        
        setScanCardModalOpen(false);
        setSuccessMessage(`Berhasil mengidentifikasi: ${namaPeminjam}`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setError("Kartu Identitas tidak dikenali atau belum terdaftar.");
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memverifikasi kartu identitas.");
    } finally {
      setIsVerifyingCard(false);
    }
  };

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return data;

    return data.filter((item) => {
      return (
        item.kode_alat?.toLowerCase().includes(keyword) ||
        item.nama_alat?.toLowerCase().includes(keyword) ||
        item.merk?.toLowerCase().includes(keyword) ||
        item.sn?.toLowerCase().includes(keyword)
      );
    });
  }, [data, searchTerm]);

  // =======================================================
  // TAMBAH KE KERANJANG (Hanya bisa jika sudah scan kartu)
  // =======================================================
  const handleAddToCart = useCallback((item: AlatUkur) => {
    if (!peminjamAktif) {
      alert("⚠️ Harap Scan Kartu Identitas Peminjam terlebih dahulu sebelum memilih barang!");
      setScanCardModalOpen(true);
      return;
    }

    setCart((prevCart) => {
      if (prevCart.some((ci) => ci.id === item.id)) return prevCart;
      return [...prevCart, item];
    });

    setSuccessMessage(`${item.nama_alat} ditambahkan ke keranjang (${peminjamAktif.nama || peminjamAktif.name}).`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [peminjamAktif]);

  return (
    <div className="datatools-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} />
          <span>{successMessage}</span>
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* BANNER INFORMASI PEMINJAM AKTIF */}
      <Card className="bg-light mb-4 border-primary">
        <CardBody className="py-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white p-2 rounded-circle">
              <IconUserCheck size={24} />
            </div>
            <div>
              <span className="text-muted small d-block">Peminjam Aktif Saat Ini:</span>
              <h5 className="mb-0 fw-bold">
                {peminjamAktif ? (peminjamAktif.nama || peminjamAktif.name) : <span className="text-danger italic">Belum ada kartu yang di-scan</span>}
              </h5>
              {peminjamAktif && <small className="text-muted">ID / RFID: {peminjamAktif.rfid || peminjamAktif.kode_identitas || '-'}</small>}
            </div>
          </div>

          <div>
            {!peminjamAktif ? (
              <Button variant="primary" onClick={() => setScanCardModalOpen(true)} className="d-flex align-items-center gap-2">
                <IconId size={18} />
                Scan Kartu Identitas Dulu
              </Button>
            ) : (
              <Button variant="outline-danger" size="sm" onClick={() => { setPeminjamAktif(null); setCart([]); }} className="d-flex align-items-center gap-1">
                <IconLogout size={16} />
                Ganti Peminjam / Reset
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Data Alat Ukur</h1>
              <p className="text-secondary mb-0">Pilih alat ukur untuk peminjaman setelah melakukan scan identitas.</p>
              <DasherBreadcrumb />
            </div>

            <div>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => { setActiveAlatUkur(null); setFormModalOpen(true); }}>
                <IconPlus size={18} />
                Tambah Data Alat
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        <div className="datatools-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={6} md={7}>
              <InputGroup className="datatools-search">
                <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari kode, nama, merk, SN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="link" className="datatools-search-clear" onClick={() => setSearchTerm("")}>
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>
        </div>

        <CardBody>
          {loading ? (
            <div className="text-center py-6"><Spinner animation="border" size="sm" className="me-2" />Memuat data...</div>
          ) : (
            <ColumnDefinition
              items={filteredData}
              onDetail={(item) => { setActiveAlatUkur(item); setDetailModalOpen(true); }}
              onEdit={(item) => { setActiveAlatUkur(item); setFormModalOpen(true); }}
              onDelete={(item) => { setActiveAlatUkur(item); setDeleteModalOpen(true); }}
              onAddToCart={handleAddToCart}
            />
          )}
        </CardBody>
      </Card>

      {/* MODAL SCAN KARTU DI AWAL */}
      <Modal show={scanCardModalOpen} onHide={() => setScanCardModalOpen(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <IconId size={22} />
            Wajib Scan Kartu Identitas
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          {isVerifyingCard ? (
            <>
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Memverifikasi Kartu Peminjam...</h5>
            </>
          ) : (
            <>
              <div className="text-primary mb-3">
                <IconId size={56} />
              </div>
              <h5>Silakan Tap Kartu RFID Anda ke Reader</h5>
              <p className="text-secondary small mb-0">
                Anda harus melakukan scan kartu identitas terlebih dahulu sebelum bisa memilih atau men-scan barang pinjaman.
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* MODAL FORM / DETAIL */}
      <AlatUkurFormModal isOpen={formModalOpen} item={activeAlatUkur} onClose={() => setFormModalOpen(false)} onSubmit={() => loadAlatUkur()} />
      <AlatUkurDetailModal item={detailModalOpen ? activeAlatUkur : null} onClose={() => setDetailModalOpen(false)} />
      <DeleteConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={() => loadAlatUkur()} />

      {/* LOAN FORM / CHECKOUT FINAL */}
      <LoanFormModal
        show={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
        onSubmit={() => {
          setCart([]);
          setPeminjamAktif(null);
          setLoanModalOpen(false);
          setSuccessMessage("Peminjaman berhasil diajukan!");
        }}
        cartItems={cart}
        {...({ peminjam: peminjamAktif } as any)}
      />

      {/* TOMBOL KERANJANG (FAB) */}
      <CartFAB
        count={cart.length}
        onClick={() => {
          if (!peminjamAktif) {
            alert("Scan kartu identitas peminjam terlebih dahulu!");
            setScanCardModalOpen(true);
            return;
          }
          if (cart.length === 0) {
            alert("Keranjang masih kosong.");
            return;
          }
          setLoanModalOpen(true);
        }}
      />
    </div>
  );
};

export default DataAlatUkurManager;