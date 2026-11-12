"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Form, Row, Col, Button, Spinner, InputGroup, Alert } from "react-bootstrap";
import {
  IconClipboardCheck,
  IconDeviceFloppy,
  IconAlertTriangle,
  IconBarcode,
  IconCircleCheck,
} from "@tabler/icons-react";
import apiFetch from "/lib/apiFetch";
import { useBarcodeScanner } from "hooks/useBarcodeScanner";
import { RiwayatKalibrasiType } from "types/RiwayatTypes";


// Warna tema PLN (sama dengan RiwayatKalibrasiManager)
const NAVY = "#06355f";
const BLUE = "#0b6bb8";
const YELLOW = "#ffc20e";
const LINE = "#dbe5f1";
const SOFT_BLUE = "#e6f0fa";

// Gaya bersama (inline style props, tanpa CSS terpisah)
const labelStyle = { fontSize: ".8rem", fontWeight: 600, color: "#14233b", marginBottom: 4 };
const controlStyle = { backgroundColor: "#f6f9fc", borderColor: LINE, borderRadius: 10 };
const hintStyle = { fontSize: ".72rem" };

interface AlatUkurOption {
  id: string;
  kode_alat: string;
  nama_alat: string;
  sn?: string | null;
}

export interface KalibrasiFormValues {
  alatUkurId: string;
  tanggalKalibrasi: string;
  tanggalJatuhTempo: string;
  kondisi: "Baik" | "RPP" | "RT";
  pelaksanaKalibrasi: string;
  keterangan: string;
  fileSertifikat: File | null;
  fileSertifikatUrl?: string | null; // URL sertifikat yang sudah tersimpan (mode edit)
}

interface KalibrasiFormModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (values: KalibrasiFormValues) => void;
  submitting?: boolean;
  error?: string | null;
  initialScanCode?: string | null;
  /** Jika diisi, modal berjalan dalam mode edit. */
  initialData?: RiwayatKalibrasiType | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const emptyForm = (): KalibrasiFormValues => ({
  alatUkurId: "",
  tanggalKalibrasi: new Date().toISOString().slice(0, 10),
  tanggalJatuhTempo: "",
  kondisi: "Baik",
  pelaksanaKalibrasi: "",
  keterangan: "",
  fileSertifikat: null,
});

// Nilai kosong dari API dipetakan jadi "-" oleh service, kembalikan ke string kosong untuk form.
const dashToEmpty = (value?: string | null) => (!value || value === "-" ? "" : value);

const formFromInitialData = (item: RiwayatKalibrasiType): KalibrasiFormValues => ({
  alatUkurId: item.alatUkurId,
  tanggalKalibrasi: (item.tanggalKalibrasiRaw ?? "").slice(0, 10),
  tanggalJatuhTempo: (item.tanggalJatuhTempoRaw ?? "").slice(0, 10),
  kondisi: item.kondisi,
  pelaksanaKalibrasi: dashToEmpty(item.pelaksana),
  keterangan: dashToEmpty(item.keterangan),
  fileSertifikat: null,
});

const Req = () => <span className="text-danger"> *</span>;

const SectionTitle = ({ children, first = false }: { children: React.ReactNode; first?: boolean }) => (
  <div
    className="d-flex align-items-center gap-2"
    style={{ fontSize: ".78rem", fontWeight: 700, color: BLUE, margin: first ? "8px 0 10px" : "18px 0 10px" }}
  >
    {children}
    <div style={{ flex: 1, height: 1, background: LINE }} />
  </div>
);

const SelectedAlatBox = ({
  kode,
  nama,
  action,
}: {
  kode: string;
  nama: string;
  action?: React.ReactNode;
}) => (
  <div
    className="d-flex justify-content-between align-items-center gap-2 mt-2 px-3 py-2"
    style={{ background: "#e8f6ee", border: "1px solid #bfe3cd", borderRadius: 12 }}
  >
    <div className="d-flex align-items-center gap-2">
      <IconCircleCheck size={22} color="#198754" />
      <div>
        <div className="fw-bold lh-sm" style={{ color: NAVY }}>{kode}</div>
        <div className="small" style={{ color: "#3d5a49" }}>{nama}</div>
      </div>
    </div>
    {action}
  </div>
);

const KalibrasiFormModal = ({
  show,
  onClose,
  onSubmit,
  submitting = false,
  error = null,
  initialScanCode = null,
  initialData = null,
}: KalibrasiFormModalProps) => {
  const isEdit = !!initialData;

  const [form, setForm] = useState<KalibrasiFormValues>(emptyForm());
  const [alatList, setAlatList] = useState<AlatUkurOption[]>([]);
  const [loadingAlat, setLoadingAlat] = useState(false);

  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [scanValue, setScanValue] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const isProcessingScanRef = useRef(false);
  const initialScanDone = useRef(false);

  const selectedAlat = alatList.find((a) => a.id === form.alatUkurId) ?? null;

  useEffect(() => {
    if (!show) return;

    setMode("scan");
    setScanValue("");
    setScanError(null);
    setFileError(null);
    if (fileRef.current) fileRef.current.value = "";
    initialScanDone.current = false;

    // Mode edit: isi form dari data yang dipilih. Daftar alat tidak perlu dimuat
    // karena alat ukur tidak bisa diganti.
    if (initialData) {
      setForm(formFromInitialData(initialData));
      setAlatList([]);
      setLoadingAlat(false);
      return;
    }

    // Mode tambah
    setForm(emptyForm());
    setLoadingAlat(true);
    apiFetch<{ status: string; data: AlatUkurOption[] }>("/alat-ukur")
      .then((res) => setAlatList(res.data ?? []))
      .catch(() => setAlatList([]))
      .finally(() => setLoadingAlat(false));
  }, [show, initialData]);

  const processScan = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      if (isProcessingScanRef.current) return;
      isProcessingScanRef.current = true;

      try {
        if (loadingAlat) {
          setScanError("Data alatukur masih dimuat, silakan scan ulang sebentar lagi.");
          return;
        }

        const codeUpper = code.toUpperCase();
        const found = alatList.find(
          (a) =>
            String(a.kode_alat || "").trim().toUpperCase() === codeUpper ||
            String(a.sn || "").trim().toUpperCase() === codeUpper ||
            String(a.id).trim().toUpperCase() === codeUpper
        );

        if (found) {
          setForm((p) => ({ ...p, alatUkurId: found.id }));
          setScanError(null);
        } else {
          setScanError(`Kode "${code}" tidak dikenali sebagai alatukur terdaftar.`);
        }
        setScanValue("");
        scanRef.current?.focus();
      } finally {
        isProcessingScanRef.current = false;
      }
    },
    [alatList, loadingAlat]
  );

  useBarcodeScanner({
    enabled: show && !isEdit && mode === "scan" && !submitting,
    onScan: processScan,
  });

  useEffect(() => {
    if (isEdit) return;
    if (!show || loadingAlat || !initialScanCode || initialScanDone.current) return;
    if (alatList.length === 0) return;
    initialScanDone.current = true;
    processScan(initialScanCode);
  }, [isEdit, show, loadingAlat, alatList, initialScanCode, processScan]);

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      processScan(scanValue);
    }
  };

  const clearSelection = () => {
    setForm((p) => ({ ...p, alatUkurId: "" }));
    setScanError(null);
    setTimeout(() => scanRef.current?.focus(), 0);
  };

  // Mendukung ekstensi PDF dan Excel
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);

    if (file) {
      const isAllowedFormat =
        file.type === "application/pdf" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.toLowerCase().match(/\.(pdf|xls|xlsx)$/);

      if (!isAllowedFormat) {
        setFileError("File harus berformat PDF atau Excel (.xls/.xlsx).");
      } else if (file.size > MAX_FILE_SIZE) {
        setFileError("Ukuran file maksimal 5 MB.");
      } else {
        setForm((p) => ({ ...p, fileSertifikat: file }));
        return;
      }
      e.target.value = "";
    }
    setForm((p) => ({ ...p, fileSertifikat: null }));
  };

  // File sertifikat ikut dikirim ke backend (disimpan privat di server) oleh komponen induk
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isProcessDisabled = submitting;

  return (
    <Modal
      show={show}
      onHide={isProcessDisabled ? undefined : onClose}
      onEntered={() => {
        if (!isEdit) scanRef.current?.focus();
      }}
      centered
      backdrop={isProcessDisabled ? "static" : true}
      contentClassName="border-0 rounded-4 overflow-hidden"
    >
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${YELLOW} 0 55%, #e2231a 55% 70%, #00a7c4 70%)`,
        }}
      />
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!isProcessDisabled} className="border-0 px-4 pt-4 pb-1">
          <Modal.Title as="div" className="d-flex align-items-center gap-3">
            <div
              className="d-grid"
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: SOFT_BLUE,
                color: BLUE,
                placeItems: "center",
              }}
            >
              <IconClipboardCheck size={22} />
            </div>
            <div>
              <div className="lh-sm" style={{ fontSize: "1.1rem", fontWeight: 800, color: NAVY }}>
                {isEdit ? "Edit Riwayat Kalibrasi" : "Catat Kalibrasi Baru"}
              </div>
              <div className="text-secondary fw-normal" style={{ fontSize: ".78rem" }}>
                Kolom bertanda * wajib diisi
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 pt-2 pb-1">
          {error && (
            <Alert
              variant="danger"
              className="d-flex align-items-center gap-2 small mt-2 mb-0"
              style={{ border: 0, borderRadius: 12 }}
              role="alert"
            >
              <IconAlertTriangle size={18} />
              <span>{error}</span>
            </Alert>
          )}

          <SectionTitle first>Alat yang dikalibrasi</SectionTitle>
          <Row className="g-3">
            <Col md={12}>
              {isEdit && initialData ? (
                <>
                  <Form.Label style={labelStyle}>Alat Ukur</Form.Label>
                  <SelectedAlatBox kode={initialData.kodeAlat} nama={initialData.namaAlat} />
                  <div className="text-secondary mt-1" style={hintStyle}>
                    Alat ukur tidak dapat diganti saat mengedit riwayat.
                  </div>
                </>
              ) : mode === "scan" ? (
                <>
                  <Form.Label style={labelStyle}>Scan Barcode Alat Ukur<Req /></Form.Label>
                  <InputGroup>
                    <InputGroup.Text
                      style={{
                        backgroundColor: SOFT_BLUE,
                        borderColor: LINE,
                        color: BLUE,
                        borderRadius: "10px 0 0 10px",
                      }}
                    >
                      <IconBarcode size={18} />
                    </InputGroup.Text>
                    <Form.Control
                      ref={scanRef}
                      type="text"
                      autoComplete="off"
                      style={{ ...controlStyle, borderRadius: "0 10px 10px 0" }}
                      placeholder={loadingAlat ? "Memuat data alat..." : "Arahkan scanner ke barcode alat..."}
                      value={scanValue}
                      onChange={(e) => {
                        setScanValue(e.target.value);
                        if (scanError) setScanError(null);
                      }}
                      onKeyDown={handleScanKeyDown}
                      disabled={isProcessDisabled}
                    />
                  </InputGroup>

                  {scanError && (
                    <div className="text-danger small mt-1" role="alert">
                      {scanError}
                    </div>
                  )}

                  {selectedAlat ? (
                    <SelectedAlatBox
                      kode={selectedAlat.kode_alat}
                      nama={`${selectedAlat.nama_alat}${selectedAlat.sn ? ` · SN ${selectedAlat.sn}` : ""}`}
                      action={
                        <Button
                          type="button"
                          size="sm"
                          variant="outline-secondary"
                          onClick={clearSelection}
                          disabled={isProcessDisabled}
                        >
                          Ganti
                        </Button>
                      }
                    />
                  ) : (
                    <>
                      <div
                        className="d-flex align-items-center gap-3 mt-2 px-3 py-2 fw-semibold small"
                        style={{
                          border: "1px dashed #9db9d6",
                          borderRadius: 12,
                          background: "#f6f9fc",
                          color: NAVY,
                        }}
                      >
                        <div
                          className="d-grid flex-shrink-0"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: SOFT_BLUE,
                            color: BLUE,
                            placeItems: "center",
                          }}
                        >
                          {loadingAlat ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <IconBarcode size={22} />
                          )}
                        </div>
                        <span>{loadingAlat ? "Memuat data alat..." : "Siap membaca barcode alat"}</span>
                      </div>
                      <div className="text-secondary mt-1" style={hintStyle}>
                        Scan dengan scanner (kode alat atau SN), atau ketik kodenya lalu tekan Enter.
                      </div>
                    </>
                  )}

                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 mt-2 fw-semibold"
                    style={{ color: BLUE }}
                    onClick={() => setMode("manual")}
                    disabled={isProcessDisabled}
                  >
                    Barcode rusak? Pilih manual dari daftar
                  </Button>
                </>
              ) : (
                <>
                  <Form.Label style={labelStyle}>Alat Ukur<Req /></Form.Label>
                  <Form.Select
                    required
                    style={controlStyle}
                    value={form.alatUkurId}
                    onChange={(e) => setForm((p) => ({ ...p, alatUkurId: e.target.value }))}
                    disabled={loadingAlat || isProcessDisabled}
                  >
                    <option value="">{loadingAlat ? "Memuat..." : "Pilih alatukur..."}</option>
                    {alatList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.kode_alat} — {a.nama_alat}
                      </option>
                    ))}
                  </Form.Select>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 mt-2 fw-semibold"
                    style={{ color: BLUE }}
                    onClick={() => {
                      setMode("scan");
                      setTimeout(() => scanRef.current?.focus(), 0);
                    }}
                    disabled={isProcessDisabled}
                  >
                    Kembali ke scan barcode
                  </Button>
                </>
              )}
            </Col>
          </Row>

          <SectionTitle>Jadwal kalibrasi</SectionTitle>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label style={labelStyle}>Tanggal Kalibrasi<Req /></Form.Label>
              <Form.Control
                type="date"
                required
                style={controlStyle}
                value={form.tanggalKalibrasi}
                onChange={(e) => setForm((p) => ({ ...p, tanggalKalibrasi: e.target.value }))}
                disabled={isProcessDisabled}
              />
            </Col>

            <Col md={6}>
              <Form.Label style={labelStyle}>Jatuh Tempo Berikutnya</Form.Label>
              <Form.Control
                type="date"
                style={controlStyle}
                value={form.tanggalJatuhTempo}
                onChange={(e) => setForm((p) => ({ ...p, tanggalJatuhTempo: e.target.value }))}
                disabled={isProcessDisabled}
              />
            </Col>
          </Row>

          <SectionTitle>Hasil dan pelaksana</SectionTitle>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label style={labelStyle}>Hasil Kalibrasi<Req /></Form.Label>
              <Form.Select
                required
                style={controlStyle}
                value={form.kondisi}
                onChange={(e) =>
                  setForm((p) => ({ ...p, kondisi: e.target.value as KalibrasiFormValues["kondisi"] }))
                }
                disabled={isProcessDisabled}
              >
                <option value="Baik">Baik</option>
                <option value="RPP">RPP (rusak, perlu perbaikan)</option>
                <option value="RT">RT (rusak total)</option>
              </Form.Select>
              <div className="text-secondary mt-1" style={hintStyle}>
                Alat RPP dan RT tidak bisa dipinjamkan.
              </div>
            </Col>

            <Col md={12}>
              <Form.Label style={labelStyle}>Pelaksana Kalibrasi</Form.Label>
              <Form.Control
                type="text"
                style={controlStyle}
                placeholder="Nama pelaksana..."
                value={form.pelaksanaKalibrasi}
                onChange={(e) => setForm((p) => ({ ...p, pelaksanaKalibrasi: e.target.value }))}
                disabled={isProcessDisabled}
              />
            </Col>
          </Row>

          <SectionTitle>Sertifikat kalibrasi</SectionTitle>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label style={labelStyle}>Dokumen Laporan/Sertifikat</Form.Label>
              <Form.Control
                ref={fileRef}
                type="file"
                style={controlStyle}
                accept=".pdf,application/pdf,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={isProcessDisabled}
              />
              {fileError && (
                <div className="text-danger small mt-1" role="alert">
                  {fileError}
                </div>
              )}
              <div className="text-secondary mt-1" style={hintStyle}>
                {isEdit && initialData?.fileSertifikatUrl ? (
                  <>
                    Sertifikat saat ini:{" "}
                    <a href={initialData.fileSertifikatUrl} target="_blank" rel="noopener noreferrer">
                      buka
                    </a>
                    . Pilih file baru hanya jika ingin menggantinya. Format PDF atau Excel, maksimal 5 MB.
                  </>
                ) : (
                  "Opsional. Format PDF atau Excel, maksimal 5 MB."
                )}
              </div>
            </Col>
          </Row>

          <SectionTitle>Catatan</SectionTitle>
          <Row className="g-3 pb-2">
            <Col md={12}>
              <Form.Label style={labelStyle}>Keterangan</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                style={controlStyle}
                placeholder="Catatan tambahan (opsional)..."
                value={form.keterangan}
                onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
                disabled={isProcessDisabled}
              />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="border-0 px-4 pt-3 pb-4 gap-2">
          <Button
            type="button"
            className="d-inline-flex align-items-center gap-2"
            style={{
              backgroundColor: "#eef3f9",
              border: 0,
              borderRadius: 11,
              color: NAVY,
              fontWeight: 700,
            }}
            onClick={onClose}
            disabled={isProcessDisabled}
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="d-inline-flex align-items-center gap-2"
            style={{
              backgroundColor: YELLOW,
              border: 0,
              borderRadius: 11,
              color: NAVY,
              fontWeight: 700,
            }}
            disabled={!form.alatUkurId || isProcessDisabled}
          >
            {isProcessDisabled ? (
              <>
                <Spinner animation="border" size="sm" />
                Menyimpan...
              </>
            ) : (
              <>
                <IconDeviceFloppy size={18} /> {isEdit ? "Simpan perubahan" : "Simpan kalibrasi"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default KalibrasiFormModal;