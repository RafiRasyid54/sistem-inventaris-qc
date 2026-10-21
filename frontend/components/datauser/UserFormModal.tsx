"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import { IconUser, IconPencil, IconPlus, IconEye, IconEyeOff } from "@tabler/icons-react";

import { UserFormValues, UserItemType } from "types/DataUserTypes";

// Sesuaikan default values
const emptyForm: UserFormValues = {
  full_name: "",
  username: "",
  email: "",
  password: "",
  divisi: "",
};

interface UserFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  initialData?: UserItemType | null;
  error?: string | null;
}

const UserFormModal = ({
  show,
  onClose,
  onSubmit,
  initialData,
  error,
}: UserFormModalProps) => {
  const [form, setForm] = useState<UserFormValues>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (show) {
      if (initialData) {
        setForm({
          full_name: initialData.full_name || "",
          username: initialData.username || "",
          email: initialData.email || "", // Fallback untuk email
          password: "", // Selalu dikosongkan saat mode edit
          divisi: initialData.divisi || "", // Fallback untuk divisi
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [show, initialData]);

  const handleChange = (field: keyof UserFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5" className="d-flex align-items-center gap-2">
            {isEditMode ? <IconPencil size={20} /> : <IconUser size={20} />}
            {isEditMode ? "Edit User" : "Tambah User Baru"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          <Row className="g-3">
            <Col md={6}>
              <Form.Label>
                Nama Lengkap <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                value={form.full_name || ""}
                onChange={(e) => handleChange("full_name", e.target.value)}
              />
            </Col>

            <Col md={6}>
              <Form.Label>
                Username <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                type="text"
                value={form.username || ""}
                onChange={(e) => handleChange("username", e.target.value)}
              />
            </Col>

            <Col md={6}>
              <Form.Label>
                Email <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                type="email"
                value={form.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Col>

            {!isEditMode && (
              <Col md={6}>
                <Form.Label>
                  Password <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    required
                    type={showPassword ? "text" : "password"}
                    value={form.password || ""}
                    onChange={(e) => handleChange("password", e.target.value)}
                    style={{ paddingRight: "40px" }}
                  />
                  <span
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#6c757d",
                    }}
                  >
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </span>
                </div>
              </Col>
            )}

            <Col md={6}>
              <Form.Label>Divisi</Form.Label>
              <Form.Control
                value={form.divisi || ""}
                onChange={(e) => handleChange("divisi", e.target.value)}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" type="submit" className="d-inline-flex align-items-center gap-2">
            {isEditMode ? <IconPencil size={18} /> : <IconPlus size={18} />}
            {isEditMode ? "Simpan Perubahan" : "Tambah User"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UserFormModal;