import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { IconTool, IconDeviceFloppy } from '@tabler/icons-react';
import { AlatUkur } from '../../types/DataAlatUkurTypes';

interface AlatUkurFormModalProps {
  isOpen: boolean;
  item: AlatUkur | null;
  onClose: () => void;
  onSubmit: (formData: Partial<AlatUkur>) => void;
}

const defaultForm: Partial<AlatUkur> = {
  kode_alat: '',
  nama_alat: '',
  kategori: '', // Menyimpan input Mekanik/Elektrik/Sipil
  merk: '',
  sn: '',
  spesifikasi: '',
  kondisi: 'Baik',
  tanggal_kalibrasi_terakhir: '', // Disesuaikan dengan API Laravel
  tanggal_kalibrasi_selanjutnya: '', // Disesuaikan dengan API Laravel
  lokasi: '',
  keterangan: '',
};

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
`;

const Req = () => <span className="text-danger"> *</span>;

export const AlatUkurFormModal: React.FC<AlatUkurFormModalProps> = ({
  isOpen,
  item,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<Partial<AlatUkur>>(defaultForm);

  useEffect(() => {
    if (item) {
      setForm({
        ...item,
        // Format tanggal ke YYYY-MM-DD agar muncul di input type="date"
        tanggal_kalibrasi_terakhir: item.tanggal_kalibrasi_terakhir ? item.tanggal_kalibrasi_terakhir.split('T')[0] : '',
        tanggal_kalibrasi_selanjutnya: item.tanggal_kalibrasi_selanjutnya ? item.tanggal_kalibrasi_selanjutnya.split('T')[0] : '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [item, isOpen]);

  return (
    <>
      <style>{CSS}</style>
      <Modal
        show={isOpen}
        onHide={onClose}
        centered
        size="lg"
        backdrop="static"
        backdropClassName="pln-modal-backdrop"
        contentClassName="pln-form"
      >
        <div className="pf-stripe" />
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title as="div" className="pf-title">
              <span className="ic"><IconTool size={22} /></span>
              <span>
                <b>{item ? 'Edit Data Alat Ukur' : 'Tambah Data Alat Ukur'}</b>
                <span className="s">Kolom bertanda * wajib diisi</span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="pf-sec">Identitas alat</div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Kode Alat<Req /></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="misal: 3MMC001"
                  value={form.kode_alat || ''}
                  onChange={(e) => setForm({ ...form, kode_alat: e.target.value })}
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label>Serial Number (SN)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="misal: SN-12345"
                  value={form.sn || ''}
                  onChange={(e) => setForm({ ...form, sn: e.target.value })}
                />
              </Col>

              <Col md={12}>
                <Form.Label>Nama Alat Ukur<Req /></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="misal: Outside Micrometer"
                  value={form.nama_alat || ''}
                  onChange={(e) => setForm({ ...form, nama_alat: e.target.value })}
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>Merk</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="misal: Mitutoyo"
                  value={form.merk || ''}
                  onChange={(e) => setForm({ ...form, merk: e.target.value })}
                />
              </Col>

              <Col md={6}>
                <Form.Label>Kategori / Bidang<Req /></Form.Label>
                <Form.Select
                  value={form.kategori || ''}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  required
                >
                  <option value="">Pilih Kategori...</option>
                  <option value="Mekanik">Mekanik</option>
                  <option value="Elektrik">Elektrik</option>
                  <option value="Sipil">Sipil</option>
                </Form.Select>
              </Col>
            </Row>

            <div className="pf-sec">Kondisi dan spesifikasi</div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Kondisi</Form.Label>
                <Form.Select
                  value={form.kondisi || 'Baik'}
                  onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
                >
                  <option value="Baik">Baik</option>
                  <option value="RPP">RPP (Perlu Perbaikan)</option>
                  <option value="RT">RT (Rusak)</option>
                </Form.Select>
                <div className="pf-hint">Alat RPP dan RT tidak bisa dipinjamkan.</div>
              </Col>

              <Col md={6}>
                <Form.Label>Spesifikasi</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="misal: 0-25mm 0.001mm"
                  value={form.spesifikasi || ''}
                  onChange={(e) => setForm({ ...form, spesifikasi: e.target.value })}
                />
              </Col>
            </Row>

            <div className="pf-sec">Jadwal kalibrasi</div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Tanggal Kalibrasi Terakhir</Form.Label>
                <Form.Control
                  type="date"
                  value={form.tanggal_kalibrasi_terakhir || ''}
                  onChange={(e) => setForm({ ...form, tanggal_kalibrasi_terakhir: e.target.value })}
                />
              </Col>

              <Col md={6}>
                <Form.Label>Rencana Kalibrasi Berikutnya</Form.Label>
                <Form.Control
                  type="date"
                  value={form.tanggal_kalibrasi_selanjutnya || ''}
                  onChange={(e) => setForm({ ...form, tanggal_kalibrasi_selanjutnya: e.target.value })}
                />
              </Col>
            </Row>

            <div className="pf-sec">Penyimpanan dan catatan</div>
            <Row className="g-3 pb-2">
              <Col md={12}>
                <Form.Label>Lokasi Penyimpanan</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="misal: Lemari A1"
                  value={form.lokasi || ''}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                />
              </Col>

              <Col md={12}>
                <Form.Label>Keterangan</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={form.keterangan || ''}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" className="pf-btn pf-ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="pf-btn pf-save">
              <IconDeviceFloppy size={18} /> Simpan data
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};