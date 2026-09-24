import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
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
  kategori: '',
  merk: '',
  sn: '',
  spesifikasi: '',
  kondisi: 'Baik',
  status_kalibrasi: 'Terkalibrasi',
  kalibrasi: '',
  rencana_kalibrasi: '',
  lokasi: '',
  keterangan: '',
};

export const AlatUkurFormModal: React.FC<AlatUkurFormModalProps> = ({
  isOpen,
  item,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<Partial<AlatUkur>>(defaultForm);

  useEffect(() => {
    if (item) {
      setForm(item);
    } else {
      setForm(defaultForm);
    }
  }, [item, isOpen]);

  return (
    <Modal show={isOpen} onHide={onClose} centered size="lg" backdrop="static">
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            {item ? 'Edit Data Alat Ukur' : 'Tambah Data Alat Ukur'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label className="small font-weight-bold">
                Kode Alat <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="misal: 3MMC001"
                value={form.kode_alat || ''}
                onChange={(e) => setForm({ ...form, kode_alat: e.target.value })}
                required
              />
            </Col>
            <Col md={6}>
              <Form.Label className="small font-weight-bold">
                Serial Number (SN)
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="misal: SN-12345"
                value={form.sn || ''}
                onChange={(e) => setForm({ ...form, sn: e.target.value })}
              />
            </Col>

            <Col md={12}>
              <Form.Label className="small font-weight-bold">
                Nama Alat Ukur <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="misal: Outside Micrometer"
                value={form.nama_alat || ''}
                onChange={(e) => setForm({ ...form, nama_alat: e.target.value })}
                required
              />
            </Col>

            <Col md={6}>
              <Form.Label className="small font-weight-bold">Merk</Form.Label>
              <Form.Control
                type="text"
                placeholder="misal: Mitutoyo"
                value={form.merk || ''}
                onChange={(e) => setForm({ ...form, merk: e.target.value })}
              />
            </Col>

            <Col md={6}>
              <Form.Label className="small font-weight-bold">Kategori / Bidang</Form.Label>
              <Form.Select
                value={form.kategori || ''}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              >
                <option value="">Pilih Kategori...</option>
                <option value="Mekanik">Mekanik</option>
                <option value="Elektrik">Elektrik</option>
                <option value="Sipil">Sipil</option>
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label className="small font-weight-bold">Kondisi</Form.Label>
              <Form.Select
                value={form.kondisi || 'Baik'}
                onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
              >
                <option value="Baik">Baik</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Rusak">Rusak</option>
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label className="small font-weight-bold">Status Kalibrasi</Form.Label>
              <Form.Select
                value={form.status_kalibrasi || 'Terkalibrasi'}
                onChange={(e) => setForm({ ...form, status_kalibrasi: e.target.value })}
              >
                <option value="Terkalibrasi">Terkalibrasi</option>
                <option value="Perlu Kalibrasi">Perlu Kalibrasi</option>
                <option value="Expired">Expired</option>
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label className="small font-weight-bold">Spesifikasi</Form.Label>
              <Form.Control
                type="text"
                placeholder="misal: 0-25mm 0.001mm"
                value={form.spesifikasi || ''}
                onChange={(e) => setForm({ ...form, spesifikasi: e.target.value })}
              />
            </Col>

            <Col md={6}>
              <Form.Label className="small font-weight-bold">Lokasi Penyimpanan</Form.Label>
              <Form.Control
                type="text"
                placeholder="misal: Lemari A1"
                value={form.lokasi || ''}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              />
            </Col>

            <Col md={6}>
              <Form.Label className="small font-weight-bold">Tanggal Kalibrasi</Form.Label>
              <Form.Control
                type="date"
                value={form.kalibrasi || ''}
                onChange={(e) => setForm({ ...form, kalibrasi: e.target.value })}
              />
            </Col>

            <Col md={6}>
              <Form.Label className="small font-weight-bold">Rencana Kalibrasi</Form.Label>
              <Form.Control
                type="date"
                value={form.rencana_kalibrasi || ''}
                onChange={(e) => setForm({ ...form, rencana_kalibrasi: e.target.value })}
              />
            </Col>

            <Col md={12}>
              <Form.Label className="small font-weight-bold">Keterangan</Form.Label>
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
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit">
            Simpan Data
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};