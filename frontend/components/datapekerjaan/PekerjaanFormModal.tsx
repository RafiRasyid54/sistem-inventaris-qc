"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { IconBriefcase, IconPencil, IconPlus } from '@tabler/icons-react';
import { Pekerjaan } from './ColumnDefination';

interface PekerjaanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Pekerjaan>) => void;
  initialData?: Pekerjaan | null;
}

// Gaya form pekerjaan bertema PLN. Selector diawali .pln-kform.
const CSS = `
.pln-modal-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pln-kform{border:0!important;border-radius:20px!important;overflow:hidden}
.pln-kform .pf-stripe{height:6px;background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pln-kform .modal-header{border:0;padding:20px 24px 4px}
.pln-kform .pf-title{display:flex;align-items:center;gap:12px;margin:0}
.pln-kform .pf-title .ic{width:40px;height:40px;border-radius:11px;background:#e6f0fa;color:#0b6bb8;display:grid;place-items:center}
.pln-kform .pf-title b{display:block;font-size:1.1rem;font-weight:800;color:#06355f;line-height:1.2}
.pln-kform .pf-title .s{font-size:.78rem;color:#62708a;font-weight:400}
.pln-kform .modal-body{padding:14px 24px 6px}
.pln-kform .form-label{font-size:.8rem;font-weight:600;color:#14233b;margin-bottom:4px}
.pln-kform .form-control{background-color:#f6f9fc;border-color:#dbe5f1;border-radius:10px;padding:10px 12px}
.pln-kform .form-control:focus{background-color:#fff;border-color:#0b6bb8;box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-kform .pf-hint{font-size:.74rem;color:#8794a8;margin-top:5px}
.pln-kform .modal-footer{border:0;padding:16px 24px 22px;gap:8px}
.pln-kform .pf-btn{border:0;border-radius:11px;padding:9px 18px;font-weight:700;font-size:.9rem;display:inline-flex;align-items:center;gap:6px}
.pln-kform .pf-ghost{background:#eef3f9;color:#06355f}
.pln-kform .pf-ghost:hover{background:#e0e9f4;color:#06355f}
.pln-kform .pf-save{background:#ffc20e;color:#06355f}
.pln-kform .pf-save:hover{background:#ffc20e;color:#06355f;filter:brightness(1.06)}
`;

export default function PekerjaanFormModal({ isOpen, onClose, onSubmit, initialData }: PekerjaanFormModalProps) {
  const [namaPekerjaan, setNamaPekerjaan] = useState('');
  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setNamaPekerjaan(initialData.nama_pekerjaan);
    } else {
      setNamaPekerjaan('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nama_pekerjaan: namaPekerjaan });
    setNamaPekerjaan('');
  };

  return (
    <>
      <style>{CSS}</style>
      <Modal
        show={isOpen}
        onHide={onClose}
        centered
        backdropClassName="pln-modal-backdrop"
        contentClassName="pln-kform"
      >
        <div className="pf-stripe" />
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title as="div" className="pf-title">
              <span className="ic">
                {isEdit ? <IconPencil size={22} /> : <IconBriefcase size={22} />}
              </span>
              <span>
                <b>{isEdit ? 'Edit Pekerjaan' : 'Tambah Pekerjaan'}</b>
                <span className="s">Muncul sebagai pilihan saat peminjaman alat</span>
              </span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Label htmlFor="namaPekerjaanInput">
              Nama Pekerjaan <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              id="namaPekerjaanInput"
              type="text"
              autoFocus
              placeholder="Contoh: Pengukuran dimensi trafo"
              value={namaPekerjaan}
              onChange={(e) => setNamaPekerjaan(e.target.value)}
              required
            />
            <div className="pf-hint">Gunakan nama yang singkat dan mudah dikenali peminjam.</div>
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" className="pf-btn pf-ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="pf-btn pf-save">
              {isEdit ? <IconPencil size={18} /> : <IconPlus size={18} />}
              Simpan
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}