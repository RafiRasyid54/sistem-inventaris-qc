"use client";

import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Alert } from "react-bootstrap";
import { Html5Qrcode } from "html5-qrcode";
import { IconCamera, IconX } from "@tabler/icons-react";

interface WebCameraScannerModalProps {
  show: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
}

const WebCameraScannerModal: React.FC<WebCameraScannerModalProps> = ({
  show,
  onClose,
  onScanSuccess,
  title = "Scan Barcode / QR Code",
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Simpan callback di ref supaya kamera tidak restart saat parent re-render
  const onScanRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onScanRef.current = onScanSuccess;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!show) return;

    let html5QrCode: Html5Qrcode | null = null;
    let handled = false;
    setErrorMsg(null);

    const timer = setTimeout(() => {
      html5QrCode = new Html5Qrcode("web-camera-reader");
      html5QrCode
        .start(
          { facingMode: "environment" }, // kamera belakang HP
          { fps: 10, qrbox: { width: 250, height: 180 } },
          (decodedText) => {
            if (handled) return; // cegah callback ganda
            handled = true;
            const code = decodedText.trim();
            html5QrCode
              ?.stop()
              .catch(console.error)
              .finally(() => {
                onScanRef.current(code);
                onCloseRef.current();
              });
          },
          () => {
            // abaikan frame kosong
          }
        )
        .catch((err) => {
          console.error("Camera error:", err);
          setErrorMsg(
            "Gagal mengakses kamera. Pastikan izin kamera diaktifkan di browser dan menggunakan koneksi HTTPS / localhost."
          );
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [show]);

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static" style={{ zIndex: 1065 }}>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
          <IconCamera size={20} className="text-primary" />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-3">
        {errorMsg ? (
          <Alert variant="danger" className="small text-start mb-0">
            {errorMsg}
          </Alert>
        ) : (
          <div>
            <div
              id="web-camera-reader"
              style={{
                width: "100%",
                borderRadius: "12px",
                overflow: "hidden",
                border: "2px solid #e2e8f0",
              }}
            />
            <p className="text-muted small mt-3 mb-0">
              Arahkan kamera HP ke Barcode / QR Code alat ukur.
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="light" size="sm" onClick={onClose} className="w-100">
          <IconX size={16} className="me-1" /> Tutup Kamera
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WebCameraScannerModal;