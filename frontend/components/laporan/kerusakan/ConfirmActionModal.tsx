"use client";
import { Modal, Form } from "react-bootstrap";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";

export type ConfirmActionVariant = "success" | "danger";

interface ConfirmActionModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: ConfirmActionVariant;
  submitting?: boolean;
  error?: string | null;
  warningText?: string;
  showNoteInput?: boolean;
  noteValue?: string;
  onNoteChange?: (value: string) => void;
  notePlaceholder?: string;
  showSeverityInput?: boolean;
  severityValue?: "ringan" | "berat" | "";
  onSeverityChange?: (value: "ringan" | "berat") => void;
  confirmDisabled?: boolean;
}

// Gaya modal konfirmasi (tema PLN). Semua selector diawali .pln-confirm.
const CSS = `
.pln-modal-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pln-confirm{border:0!important;border-radius:20px!important;overflow:hidden}
.pln-confirm .pc-stripe{height:6px;background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pln-confirm .pc-icon{width:64px;height:64px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center}
.pln-confirm .pc-icon.ok{background:#dcf4ea;color:#0b7a50}
.pln-confirm .pc-icon.bad{background:#fde1df;color:#a8160f}
.pln-confirm h5{font-weight:800;color:#06355f}
.pln-confirm .pc-msg{color:#62708a;font-size:.9rem}
.pln-confirm .pc-warn{display:flex;gap:10px;align-items:flex-start;text-align:left;background:#fff8e1;border:1px solid #ffe08a;
  color:#6b4a00;border-radius:12px;padding:10px 14px;font-size:.82rem;margin-bottom:16px}
.pln-confirm .pc-warn svg{flex:none;margin-top:1px}
.pln-confirm .pc-err{display:flex;gap:10px;align-items:flex-start;text-align:left;background:#fde1df;color:#a8160f;
  border-radius:12px;padding:10px 14px;font-size:.84rem;margin-bottom:16px}
.pln-confirm .pc-err svg{flex:none;margin-top:1px}
.pln-confirm .form-label{font-size:.8rem;font-weight:600;color:#14233b;margin-bottom:4px}
.pln-confirm .form-control{background-color:#f6f9fc;border-color:#dbe5f1;border-radius:10px}
.pln-confirm .form-control:focus{background-color:#fff;border-color:#0b6bb8;box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-confirm .form-check-input:checked{background-color:#0b6bb8;border-color:#0b6bb8}
.pln-confirm .form-check-input:focus{box-shadow:0 0 0 3px rgba(11,107,184,.16);border-color:#0b6bb8}
.pln-confirm .pc-foot{border:0;justify-content:center;gap:8px;padding:6px 24px 24px}
.pln-confirm .pc-btn{border:0;border-radius:11px;padding:9px 20px;font-weight:700;font-size:.9rem;cursor:pointer}
.pln-confirm .pc-btn:disabled{opacity:.5;cursor:not-allowed}
.pln-confirm .pc-ghost{background:#eef3f9;color:#06355f}
.pln-confirm .pc-ghost:hover:not(:disabled){background:#e0e9f4}
.pln-confirm .pc-ok{background:#12a36b;color:#fff}
.pln-confirm .pc-ok:hover:not(:disabled){filter:brightness(1.08)}
.pln-confirm .pc-bad{background:#e2231a;color:#fff}
.pln-confirm .pc-bad:hover:not(:disabled){filter:brightness(1.08)}
.pln-confirm button:focus-visible{outline:2px solid #ffc20e;outline-offset:2px}
`;

const ConfirmActionModal = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  variant = "success",
  submitting = false,
  error = null,
  warningText,
  showNoteInput = false,
  noteValue = "",
  onNoteChange,
  notePlaceholder = "Catatan perbaikan",
  showSeverityInput = false,
  severityValue = "",
  onSeverityChange,
  confirmDisabled = false,
}: ConfirmActionModalProps) => {
  const isDanger = variant === "danger";

  return (
    <>
      <style>{CSS}</style>
      <Modal
        show={show}
        onHide={submitting ? undefined : onClose}
        centered
        backdropClassName="pln-modal-backdrop"
        contentClassName="pln-confirm"
        className="confirm-action-modal"
      >
        <div className="pc-stripe" />
        <Modal.Body className="text-center py-4 px-4">
          <div className={`pc-icon ${isDanger ? "bad" : "ok"}`}>
            {isDanger ? <IconAlertTriangle size={30} /> : <IconCircleCheck size={30} />}
          </div>
          <h5 className="mb-2">{title}</h5>
          <p className="pc-msg mb-3">{message}</p>

          {warningText && (
            <div className="pc-warn" role="alert">
              <IconAlertTriangle size={18} />
              <span>{warningText}</span>
            </div>
          )}

          {showSeverityInput && (
            <Form.Group className="text-start mb-3">
              <Form.Label>
                Tingkat Kerusakan <span className="text-danger">*</span>
              </Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="severity-ringan"
                  name="tingkat_kerusakan"
                  label="Rusak Ringan"
                  checked={severityValue === "ringan"}
                  onChange={() => onSeverityChange?.("ringan")}
                />
                <Form.Check
                  type="radio"
                  id="severity-berat"
                  name="tingkat_kerusakan"
                  label="Rusak Berat"
                  checked={severityValue === "berat"}
                  onChange={() => onSeverityChange?.("berat")}
                />
              </div>
              <Form.Text className="text-secondary">
                Rusak ringan tidak dihitung ke batas maksimal perbaikan.
              </Form.Text>
            </Form.Group>
          )}

          {showNoteInput && (
            <Form.Group className="text-start mb-3">
              <Form.Label>
                Catatan Perbaikan <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder={notePlaceholder}
                value={noteValue}
                onChange={(e) => onNoteChange?.(e.target.value)}
                required
              />
            </Form.Group>
          )}

          {error && (
            <div className="pc-err mb-0" role="alert">
              <IconAlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="pc-foot">
          <button type="button" className="pc-btn pc-ghost" onClick={onClose} disabled={submitting}>
            Batal
          </button>
          <button
            type="button"
            className={`pc-btn ${isDanger ? "pc-bad" : "pc-ok"}`}
            onClick={onConfirm}
            disabled={submitting || confirmDisabled}
          >
            {submitting ? "Memproses..." : confirmLabel}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConfirmActionModal;