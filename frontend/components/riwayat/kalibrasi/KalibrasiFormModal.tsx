"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import { IconClipboardCheck } from "@tabler/icons-react";
import apiFetch from "/lib/api";

interface AlatUkurOption {
  id: string;
  kode_alat: string;
  nama_alat: string;
}

export interface KalibrasiFormValues {
  alatUkurId: string;
  tanggalKalibrasi: string;
  tanggalJatuhTempo: string;
  kondisi: "Baik" | "RPP" | "RT";
  pelaksanaKalibrasi: string;
  keterangan: string;
}

interface KalibrasiFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: KalibrasiFormValues) => void;
  submitting?: boolean;
  error?: string | null;
}

const emptyForm = (): KalibrasiFormValues => ({
  alatUkurId: "",
  tanggalKalibrasi: new Date().toISOString().slice(0, 10),
  tanggalJatuhTempo: "",
  kondisi: "Baik",
  pelaksanaKalibrasi: "",
  keterangan: "",
});

const KalibrasiFormModal = ({
  show,
  onClose,
  onSubmit,
  submitting = false,
  error = null,
}: KalibrasiFormModalProps) => {
  const [form, setForm] = useState<KalibrasiFormValues>(emptyForm());
  const [alatList, setAlatList] = useState<AlatUkurOption[]>([]);
  const [loadingAlat, setLoadingAlat] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(emptyForm());
      setLoadingAlat(true);
      apiFetch<{ status: string; data: AlatUkurOption[] }>("/alat-ukur")
        .then((res) => setAlatList(res.data ?? []))
        .catch(() => setAlatList([]))
        .finally(() => setLoadingAlat(false));
    }
  }, [show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={submitting ? undefined : onClose} centered backdrop={submitting ? "static" : true}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            <IconClipboardCheck size={20} />
            Catat Kalibrasi Baru
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Alat Ukur <span className="text-danger">*</span></Form.Label>
              <Form.Select
                required
                value={form.alatUkurId}
                onChange={(e) => setForm((p) => ({ ...p, alatUkurId: e.target.value }))}
                disabled={loadingAlat || submitting}
              >
                <option value="">{loadingAlat ? "Memuat..." : "Pilih alat ukur..."}</option>
                {alatList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.kode_alat} — {a.nama_alat}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label>Tanggal Kalibrasi <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="date"
                required
                value={form.tanggalKalibrasi}
                onChange={(e) => setForm((p) => ({ ...p, tanggalKalibrasi: e.target.value }))}
                disabled={submitting}
              />
            </Col>

            <Col md={6}>
              <Form.Label>Jatuh Tempo Berikutnya</Form.Label>
              <Form.Control
                type="date"
                value={form.tanggalJatuhTempo}
                onChange={(e) => setForm((p) => ({ ...p, tanggalJatuhTempo: e.target.value }))}
                disabled={submitting}
              />
            </Col>

            <Col md={12}>
              <Form.Label>Hasil Kalibrasi <span className="text-danger">*</span></Form.Label>
              <Form.Select
                required
                value={form.kondisi}
                onChange={(e) => setForm((p) => ({ ...p, kondisi: e.target.value as KalibrasiFormValues["kondisi"] }))}
                disabled={submitting}
              >
                <option value="Baik">Baik</option>
                <option value="RPP">RPP (rusak, perlu perbaikan)</option>
                <option value="RT">RT (rusak total)</option>
              </Form.Select>
            </Col>

            <Col md={12}>
              <Form.Label>Pelaksana Kalibrasi</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nama pelaksana..."
                value={form.pelaksanaKalibrasi}
                onChange={(e) => setForm((p) => ({ ...p, pelaksanaKalibrasi: e.target.value }))}
                disabled={submitting}
              />
            </Col>

            <Col md={12}>
              <Form.Label>Keterangan</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Catatan tambahan (opsional)..."
                value={form.keterangan}
                onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
                disabled={submitting}
              />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={!form.alatUkurId || submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Menyimpan...
              </>
            ) : (
              "Simpan Kalibrasi"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default KalibrasiFormModal;