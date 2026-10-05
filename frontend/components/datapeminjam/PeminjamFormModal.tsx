"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import {
  IconUser,
  IconPencil,
  IconPlus,
  IconIdBadge2,
  IconTool,
  IconPackage,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { PeminjamType } from "types/DataAlatUkurTypes";

export type PeminjamFormValues = Omit<PeminjamType, "id" | "aktif" | "nama"> & {
  id?: string;
  rfid_uid?: string;
  kategori: "Internal" | "Vendor";
  nama_peminta: string; // Akan berisi Nama Pegawai ATAU Nama Vendor
  divisi?: string;
  role?: "user" | "inventory man";
};

const emptyForm: PeminjamFormValues = {
  id: "",
  rfid_uid: "",
  kategori: "Internal",
  nama_peminta: "",
  divisi: "",
  role: "user",
};

const JABATAN_OPTIONS = [
  "MGTI",
  "HPI",
  "HL",
  "QC",
  "K3L",
  "Pegawai",
  "PKL",
  "Magang",
  "Lainnya",
];

interface PeminjamFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: PeminjamFormValues) => void;
  initialData?: any; 
  error?: string | null;
}

// Gaya form bertema PLN. Selector diawali .pln-pform / .pln-modal-backdrop.
const CSS = `
.pln-modal-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pln-pform{border:0!important;border-radius:20px!important;overflow:hidden}
.pln-pform .pf-stripe{height:6px;background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pln-pform .modal-header{border:0;padding:20px 24px 4px}
.pln-pform .pf-title{display:flex;align-items:center;gap:12px;margin:0}
.pln-pform .pf-title .ic{width:40px;height:40px;border-radius:11px;background:#e6f0fa;color:#0b6bb8;display:grid;place-items:center}
.pln-pform .pf-title b{display:block;font-size:1.1rem;font-weight:800;color:#06355f;line-height:1.2}
.pln-pform .pf-title .s{font-size:.78rem;color:#62708a;font-weight:400}
.pln-pform .modal-body{padding:8px 24px 6px}
.pln-pform .pf-sec{font-size:.78rem;font-weight:700;color:#0b6bb8;display:flex;align-items:center;gap:10px;margin:18px 0 10px}
.pln-pform .pf-sec::after{content:"";flex:1;height:1px;background:#dbe5f1}
.pln-pform .pf-sec:first-of-type{margin-top:8px}
.pln-pform .pf-err{display:flex;align-items:flex-start;gap:10px;font-size:.86rem;background:#fde1df;color:#a8160f;
  border-radius:12px;padding:10px 14px;margin:8px 0 0}
.pln-pform .pf-err svg{flex:none;margin-top:1px}
.pln-pform .form-label{font-size:.8rem;font-weight:600;color:#14233b;margin-bottom:4px}
.pln-pform .form-control,.pln-pform .form-select{background-color:#f6f9fc;border-color:#dbe5f1;border-radius:10px}
.pln-pform .form-control:focus,.pln-pform .form-select:focus{background-color:#fff;border-color:#0b6bb8;box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-pform .form-control[readonly]{background-color:#eef3f9;color:#62708a}
.pln-pform .form-select:disabled{background-color:#eef3f9;color:#62708a;opacity:1}
.pln-pform .pf-hint{font-size:.74rem;color:#8794a8;margin-top:5px}

.pln-pform .pf-roles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pln-pform .pf-role{text-align:left;border:1.5px solid #dbe5f1;background:#f6f9fc;border-radius:12px;padding:12px;
  display:flex;gap:10px;align-items:flex-start;cursor:pointer;transition:border-color .15s,background .15s}
.pln-pform .pf-role:hover{border-color:#9ec3e6}
.pln-pform .pf-role .ri{width:34px;height:34px;border-radius:9px;background:#e6f0fa;color:#0b6bb8;display:grid;place-items:center;flex:none}
.pln-pform .pf-role b{display:block;font-size:.88rem;color:#06355f}
.pln-pform .pf-role span.d{font-size:.74rem;color:#62708a;line-height:1.35}
.pln-pform .pf-role.on{border-color:#0b6bb8;background:#fff;box-shadow:0 0 0 3px rgba(11,107,184,.14)}
.pln-pform .pf-role.on .ri{background:#ffc20e;color:#06355f}
.pln-pform .pf-role:focus-visible{outline:2px solid #0b6bb8;outline-offset:2px}

.pln-pform .pf-rfid{background:#eef5fc;border:1.5px dashed #9ec3e6;border-radius:14px;padding:14px 16px}
.pln-pform .pf-rfid .form-label{color:#0b6bb8;display:flex;align-items:center;gap:8px}

.pln-pform .modal-footer{border:0;padding:16px 24px 22px;gap:8px}
.pln-pform .pf-btn{border:0;border-radius:11px;padding:9px 18px;font-weight:700;font-size:.9rem;display:inline-flex;align-items:center;gap:6px}
.pln-pform .pf-ghost{background:#eef3f9;color:#06355f}
.pln-pform .pf-ghost:hover{background:#e0e9f4;color:#06355f}
.pln-pform .pf-save{background:#ffc20e;color:#06355f}
.pln-pform .pf-save:hover{background:#ffc20e;color:#06355f;filter:brightness(1.06)}
@media (max-width:480px){.pln-pform .pf-roles{grid-template-columns:1fr}}
`;

const PeminjamFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  error = null,
}: PeminjamFormModalProps) => {
  const [form, setForm] = useState<PeminjamFormValues>(emptyForm);
  const [jabatanSelect, setJabatanSelect] = useState<string>("");
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (show) {
      if (initialData) {
        setForm({
          id: initialData.id,
          rfid_uid: initialData.rfid_uid || "",
          kategori: initialData.kategori || "Internal",
          nama_peminta: initialData.nama_peminta || initialData.nama || "",
          divisi: initialData.divisi || "",
          role: (initialData.role === "inventory man" ? "inventory man" : "user"),
        });

        if (initialData.kategori !== "Vendor") {
          setJabatanSelect(
            JABATAN_OPTIONS.includes(initialData.divisi)
              ? initialData.divisi
              : initialData.divisi
                ? "Lainnya"
                : ""
          );
        }
      } else {
        setForm(emptyForm);
        setJabatanSelect("");
      }
    }
  }, [show, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleRfidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const setRole = (role: "user" | "inventory man") =>
    setForm((prev) => ({ ...prev, role }));

  return (
    <>
      <style>{CSS}</style>
      <Modal
        show={show}
        onHide={onClose}
        centered
        backdrop="static"
        className="peminjam-form-modal"
        backdropClassName="pln-modal-backdrop"
        contentClassName="pln-pform"
      >
        <div className="pf-stripe" />
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title as="div" className="pf-title">
              <span className="ic">
                {isEditMode ? <IconPencil size={22} /> : <IconUser size={22} />}
              </span>
              <span>
                <b>{isEditMode ? "Edit Data Peminjam" : "Tambah Data Peminjam"}</b>
                <span className="s">
                  {isEditMode
                    ? `${form.nama_peminta}${form.divisi ? ` · ${form.divisi}` : ""}`
                    : "Kolom bertanda * wajib diisi"}
                </span>
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

            <div className="pf-sec">Kategori Peminjam</div>
            <Row className="g-3 mb-2">
              <Col md={12}>
                <Form.Select
                  value={form.kategori}
                  onChange={(e) => {
                    const val = e.target.value as "Internal" | "Vendor";
                    setJabatanSelect(""); // reset pilihan jabatan agar tidak tertinggal saat ganti kategori
                    setForm((prev) => ({
                      ...prev,
                      kategori: val,
                      rfid_uid: val === "Vendor" ? "" : prev.rfid_uid,
                      divisi: "",
                      role: "user", // Vendor otomatis user biasa
                    }));
                  }}
                  disabled={isEditMode}
                >
                  <option value="Internal">Internal PLN (Memakai Kartu RFID)</option>
                  <option value="Vendor">Vendor Eksternal (Tanpa Kartu Akses)</option>
                </Form.Select>
                {isEditMode && (
                  <div className="pf-hint">Kategori tidak bisa diubah saat mengedit data.</div>
                )}
              </Col>
            </Row>

            <div className="pf-sec">Informasi Entitas</div>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>
                  {form.kategori === "Internal" ? "Nama Pegawai" : "Nama Vendor / Perusahaan"} <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  placeholder={form.kategori === "Internal" ? "Contoh: Ahmad Sobari" : "Contoh: PT. Maju Jaya"}
                  value={form.nama_peminta}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nama_peminta: e.target.value }))
                  }
                />
              </Col>

              {form.kategori === "Internal" && (
                <Col md={12}>
                  <Form.Label>
                    Jabatan / Bagian <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    required
                    value={jabatanSelect}
                    onChange={(e) => {
                      const value = e.target.value;
                      setJabatanSelect(value);
                      if (value === "Lainnya") {
                        setForm((prev) => ({
                          ...prev,
                          divisi: JABATAN_OPTIONS.includes(prev.divisi || "") ? "" : prev.divisi,
                        }));
                      } else {
                        setForm((prev) => ({ ...prev, divisi: value }));
                      }
                    }}
                  >
                    <option value="" disabled>-- Pilih Jabatan / Bagian --</option>
                    {JABATAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Form.Select>
                  {jabatanSelect === "Lainnya" && (
                    <Form.Control
                      required
                      className="mt-2"
                      placeholder="Ketik jabatan/bagian lainnya..."
                      value={form.divisi}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, divisi: e.target.value }))
                      }
                    />
                  )}
                </Col>
              )}
            </Row>

            {form.kategori === "Internal" && (
              <>
                <div className="pf-sec">Role Akses Sistem</div>
                <div className="pf-roles" role="radiogroup" aria-label="Role akses sistem">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.role === "user"}
                    className={`pf-role ${form.role === "user" ? "on" : ""}`}
                    onClick={() => setRole("user")}
                  >
                    <span className="ri"><IconTool size={20} /></span>
                    <span>
                      <b>Pekerja</b>
                      <span className="d">Pengguna biasa, hanya bisa meminjam alat.</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.role === "inventory man"}
                    className={`pf-role ${form.role === "inventory man" ? "on" : ""}`}
                    onClick={() => setRole("inventory man")}
                  >
                    <span className="ri"><IconPackage size={20} /></span>
                    <span>
                      <b>Inventory Man</b>
                      <span className="d">Bisa input stok Consumable.</span>
                    </span>
                  </button>
                </div>

                <div className="pf-sec">Kartu Identitas</div>
                <div className="pf-rfid mb-3">
                  <Form.Label>
                    <IconIdBadge2 size={18} />
                    ID Kartu RFID <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder={isEditMode ? "Sudah terdaftar" : "Klik di sini, lalu tap kartu ke reader..."}
                    value={form.rfid_uid}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, rfid_uid: e.target.value }))
                    }
                    onKeyDown={handleRfidKeyDown}
                    autoComplete="off"
                  />
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" className="pf-btn pf-ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="pf-btn pf-save">
              {isEditMode ? <IconPencil size={18} /> : <IconPlus size={18} />}
              {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default PeminjamFormModal;