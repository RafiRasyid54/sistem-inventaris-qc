"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import { IconClipboardCheck, IconDeviceFloppy, IconAlertTriangle } from "@tabler/icons-react";
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

// Gaya form bertema PLN. Selector diawali .pln-form / .pln-modal-backdrop.
const CSS = `
.pln-modal-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pln-form{border:0!important;border-radius:20px!important;overflow:hidden}
.pln-form .pf-stripe{height:6px;background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pln-form .modal-header{border:0;padding:20px 24px 4px}
.pln-form .pf-title{display:flex;align-items:center;gap:12px;margin:0}
.pln-form .pf-title .ic{width:40px;height:40px;border-radius:11px;background:#e6f0fa;color:#0b6bb8;display:grid;place-items:center}
.pln-form .pf-title b{display:block;font-size:1.1rem;font-weight:800;color:#06355f;line-height:1.2}
.pln-form .pf-title span.s{font-size:.78rem;color:#62708a;font-weight:400}
.pln-form .modal-body{padding:8px 24px 6px}
.pln-form .pf-sec{font-size:.78rem;font-weight:700;color:#0b6bb8;display:flex;align-items:center;gap:10px;margin:18px 0 10px}
.pln-form .pf-sec::after{content:"";flex:1;height:1px;background:#dbe5f1}
.pln-form .pf-sec:first-child{margin-top:8px}
.pln-form .pf-err{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.86rem;
  background:#fde1df;color:#a8160f;padding:10px 14px;margin:8px 0 0}
.pln-form .form-label{font-size:.8rem;font-weight:600;color:#14233b;margin-bottom:4px}
.pln-form .form-control,.pln-form .form-select{background-color:#f6f9fc;border-color:#dbe5f1;border-radius:10px}
.pln-form .form-control:focus,.pln-form .form-select:focus{background-color:#fff;border-color:#0b6bb8;box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-form .pf-hint{font-size:.72rem;color:#8794a8;margin-top:4px}
.pln-form .modal-footer{border:0;padding:16px 24px 22px;gap:8px}
.pln-form .pf-btn{border:0;border-radius:11px;padding:9px 18px;font-weight:700;font-size:.9rem;display:inline-flex;align-items:center;gap:6px}
.pln-form .pf-ghost{background:#eef3f9;color:#06355f}
.pln-form .pf-ghost:hover{background:#e0e9f4;color:#06355f}
.pln-form .pf-save{background:#ffc20e;color:#06355f}
.pln-form .pf-save:hover{background:#ffc20e;color:#06355f;filter:brightness(1.06)}
.pln-form .pf-save:disabled{background:#ffc20e;color:#06355f;opacity:.5}
`;

const Req = () => <span className="text-danger"> *</span>;

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
    <>
      <style>{CSS}</style>
      <Modal
        show={show}
        onHide={submitting ? undefined : onClose}
        centered
        backdrop={submitting ? "static" : true}
        backdropClassName="pln-modal-backdrop"
        contentClassName="pln-form"
      >
        <div className="pf-stripe" />
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton={!submitting}>
            <Modal.Title as="div" className="pf-title">
              <span className="ic"><IconClipboardCheck size={22} /></span>
              <span>
                <b>Catat Kalibrasi Baru</b>
                <span className="s">Kolom bertanda * wajib diisi</span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && (
              <div className="pf-err" role="alert">
                <IconAlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="pf-sec">Alat yang dikalibrasi</div>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Alat Ukur<Req /></Form.Label>
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
            </Row>

            <div className="pf-sec">Jadwal kalibrasi</div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Tanggal Kalibrasi<Req /></Form.Label>
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
            </Row>

            <div className="pf-sec">Hasil dan pelaksana</div>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Hasil Kalibrasi<Req /></Form.Label>
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
                <div className="pf-hint">Alat RPP dan RT tidak bisa dipinjamkan.</div>
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
            </Row>

            <div className="pf-sec">Catatan</div>
            <Row className="g-3 pb-2">
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
            <Button type="button" className="pf-btn pf-ghost" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" className="pf-btn pf-save" disabled={!form.alatUkurId || submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <IconDeviceFloppy size={18} /> Simpan kalibrasi
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default KalibrasiFormModal;