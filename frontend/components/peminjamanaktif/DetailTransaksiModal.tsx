"use client";
// import node module libraries
import { Modal, Button, Table, Badge } from "react-bootstrap";
import { IconArrowBackUp } from "@tabler/icons-react";

// import custom types (ALAT UKUR)
import { TransaksiPeminjamanType } from "../../types/DataAlatUkurTypes";

const kondisiVariant = (kondisi?: string) => {
  switch (kondisi) {
    case "Baik":
      return { bg: "success-subtle", text: "success-emphasis" };
    case "Rusak":
      return { bg: "danger-subtle", text: "danger-emphasis" };
    default:
      return { bg: "secondary-subtle", text: "secondary-emphasis" };
  }
};

interface DetailTransaksiModalProps {
  show: boolean;
  onClose: () => void;
  transaksi: TransaksiPeminjamanType | null;
  onReturn: (transaksi: TransaksiPeminjamanType) => void;
}

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="d-flex justify-content-between border-bottom py-1 small">
    <span className="text-secondary">{label}</span>
    <span className="fw-semibold">{value || "-"}</span>
  </div>
);

const DetailTransaksiModal = ({
  show,
  onClose,
  transaksi,
  onReturn,
}: DetailTransaksiModalProps) => {
  if (!transaksi) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title as="h5">Detail Transaksi Peminjaman Alat Ukur</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <InfoRow label="Nama Peminjam" value={transaksi.namaPeminjam} />
          <InfoRow label="Divisi" value={transaksi.divisi} />
          <InfoRow label="Area Kerja" value={transaksi.areaKerja} />
          <InfoRow label="Tanggal Pinjam" value={transaksi.tanggalPeminjaman} />
        </div>

        <Table responsive size="sm" className="align-middle">
          <thead>
            <tr>
              <th>Kode Alat</th>
              <th>Nama Alat Ukur</th>
              <th>Kondisi Saat Dipinjam</th>
            </tr>
          </thead>
          <tbody>
            {transaksi.items?.map((item, index) => {
              const { bg, text } = kondisiVariant(item.kondisiSaatDipinjam);
              return (
                <tr key={item.alatUkurId || index}>
                  <td>
                    <span className="font-monospace text-primary fw-semibold">
                      {item.kodeAlat || "-"}
                    </span>
                  </td>
                  <td>{item.namaAlat}</td>
                  <td>
                    <Badge bg={bg} text={text}>
                      {item.kondisiSaatDipinjam || "Baik"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Tutup
        </Button>
        {transaksi.status === "Sedang Dipinjam" && (
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={() => onReturn(transaksi)}
          >
            <IconArrowBackUp size={18} />
            Alat Dikembalikan
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default DetailTransaksiModal;