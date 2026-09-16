"use client";
// import node module libraries
import { Modal, Button, Badge, Row, Col } from "react-bootstrap";
import {
  IconAlatukur,
  IconCircleCheck,
  IconAlertTriangle,
  IconPackage,
  IconArrowRight,
  IconChecks,
} from "@tabler/icons-react";

// import custom types
import { AlatukurItemType, AlatukurCondition } from "types/DataAlatukurTypes";

const kondisiVariant = (kondisi: AlatukurCondition) => {
  switch (kondisi) {
    case "Baik":
      return { bg: "success-subtle", text: "success-emphasis" };
    case "Rusak":
      return { bg: "danger-subtle", text: "danger-emphasis" };
  }
};

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}
const DetailRow = ({ label, value }: DetailRowProps) => (
  <Col md={6}>
    <div className="alat ukur-detail-item">
      <div className="text-secondary small text-uppercase mb-1">{label}</div>
      <div className="fw-semibold">{value || <span className="text-secondary">-</span>}</div>
    </div>
  </Col>
);

interface StatBoxProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  variant: "primary" | "warning" | "success" | "danger";
}
const StatBox = ({ label, value, icon, variant }: StatBoxProps) => (
  <Col xs={4}>
    <div className={`alat ukur-detail-stat text-center bg-${variant}-subtle`}>
      <div className={`text-${variant} mb-1 d-flex justify-content-center`}>{icon}</div>
      <div className="h4 mb-0 lh-1">{value}</div>
      <div className="text-secondary small mt-1">{label}</div>
    </div>
  </Col>
);

interface AlatukurDetailModalProps {
  show: boolean;
  onClose: () => void;
  alat ukur: AlatukurItemType | null;
}

const AlatukurDetailModal = ({ show, onClose, alat ukur }: AlatukurDetailModalProps) => {
  if (!alat ukur) return null;
  const { bg, text } = kondisiVariant(alat ukur.kondisi);
  const tersedia = alat ukur.stok - alat ukur.dipinjam;
  const habis = tersedia <= 0;

  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="alat ukur-detail-modal">
      <Modal.Header closeButton>
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="alat ukur-detail-title-icon">
            <IconAlatukur size={20} />
          </span>
          Detail Alat
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Hero: nama barang + kode + status kondisi */}
        <div className="alat ukur-detail-hero mb-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h4 className="mb-1">{alat ukur.namaBarang}</h4>
              <div className="text-secondary">
                Kode Barang: <span className="fw-semibold text-body">{alat ukur.kodeBarang}</span>
              </div>
            </div>
            <Badge bg={bg} text={text} className="alat ukur-detail-status d-inline-flex align-items-center gap-1">
              {alat ukur.kondisi === "Baik" ? (
                <IconCircleCheck size={16} />
              ) : (
                <IconAlertTriangle size={16} />
              )}
              {alat ukur.kondisi}
            </Badge>
          </div>
        </div>

        {/* Ringkasan stok */}
        <Row className="g-3 mb-4">
          <StatBox
            label="Total Stok"
            value={alat ukur.stok}
            icon={<IconPackage size={22} />}
            variant="primary"
          />
          <StatBox
            label="Dipinjam"
            value={alat ukur.dipinjam}
            icon={<IconArrowRight size={22} />}
            variant="warning"
          />
          <StatBox
            label="Tersedia"
            value={tersedia}
            icon={<IconChecks size={22} />}
            variant={habis ? "danger" : "success"}
          />
        </Row>

        {/* Informasi detail alat */}
        <div className="alat ukur-detail-section">
          <div className="text-secondary small text-uppercase fw-semibold mb-3">
            Spesifikasi
          </div>
          <Row className="g-3">
            <DetailRow label="Merk" value={alat ukur.merk} />
            <DetailRow label="Tipe" value={alat ukur.tipe} />
            <DetailRow label="Warna" value={alat ukur.warna} />
            <DetailRow label="Ukuran" value={alat ukur.ukuran} />
          </Row>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Tutup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AlatukurDetailModal;
