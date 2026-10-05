"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Row, Col, Alert, Spinner, Button, Modal, Form } from "react-bootstrap";
import { 
  IconCircleCheck, 
  IconAlertTriangle, 
  IconLock, 
  IconBuildingStore, 
  IconId 
} from "@tabler/icons-react";
import { createLaporanKerusakan } from "services/laporanKerusakanService";

// import custom types
import { PeminjamanAktifItemType } from "types/DataAlatUkurTypes";

// import services
import { getPeminjamanAktif, tandaiDikembalikan } from "services/peminjamanService";
import { getPeminta } from "services/pemintaService";
import { usePermission } from "hooks/usePermissions";

// import custom components
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import PengembalianAlatScanForm from "components/pengembalian/PengembalianScanForm";
import PengembalianAlatChecklist, {
  PengembalianBatchItem,
  PengembalianGroupItem,
} from "components/pengembalian/PengembalianChecklist";

// Gaya halaman Pengembalian (tema PLN). Semua selector diawali .pln-pg.
const CSS = `
.pln-pg .pg-head h1{font-weight:800;color:#06355f}
.pln-pg .pg-msg{border:0;border-radius:12px;display:flex;align-items:flex-start;gap:10px;font-size:.88rem}
.pln-pg .pg-steps{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.pln-pg .pg-step{display:flex;align-items:center;gap:8px;font-size:.8rem;color:#62708a;padding:5px 12px 5px 6px;border-radius:99px;background:#eef3f9}
.pln-pg .pg-step i{font-style:normal;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:.7rem;font-weight:800;background:#cfdbea;color:#06355f}
.pln-pg .pg-step.is-now{background:#06355f;color:#fff;font-weight:600}
.pln-pg .pg-step.is-now i{background:#ffc20e;color:#06355f}
.pln-pg .pg-step.is-done i{background:#12a36b;color:#fff}
.pln-alert-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
`;

const PengembalianManager = () => {
  const canProcess = usePermission("process_transaksi");
  const [items, setItems] = useState<PeminjamanAktifItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- State alur scan ----
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [namaPeminjamAktif, setNamaPeminjamAktif] = useState<string | null>(null);
  const [itemsPeminjam, setItemsPeminjam] = useState<PengembalianGroupItem[] | null>(null);
  const [recordsByGroup, setRecordsByGroup] = useState<Record<string, PeminjamanAktifItemType[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---- State Khusus Vendor ----
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [pendingVendor, setPendingVendor] = useState<any>(null); // Vendor yg butuh otorisasi
  const [scanAuthModalOpen, setScanAuthModalOpen] = useState(false); // Modal untuk scan kartu Inventory Man

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load Peminjaman Aktif & Data Peminta (untuk memfilter vendor)
      const [dataPeminjaman, dataPeminta] = await Promise.all([
        getPeminjamanAktif(),
        getPeminta()
      ]);

      setItems(dataPeminjaman);

      let rawPeminta: any[] = [];
      if (Array.isArray(dataPeminta)) rawPeminta = dataPeminta;
      else if (dataPeminta?.data) rawPeminta = dataPeminta.data;

      setVendorList(rawPeminta.filter((p: any) => p.kategori === "Vendor"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data peminjaman aktif";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---- Scan kartu peminjam / Approval Vendor ----
  const handleScan = async (idCard: string) => {
    setScanning(true);
    setScanError(null);
    try {
      const pemintaAktif = await getPeminta();
      let rawList: any[] = [];
      if (Array.isArray(pemintaAktif)) rawList = pemintaAktif;
      else if (pemintaAktif?.data) rawList = pemintaAktif.data;

      let targetPemintaId = "";
      let namaPeminta = "";

      // LOGIKA PEMISAHAN: Apakah sedang mode Normal atau Approval Vendor?
      if (pendingVendor) {
        // 1. MODE APPROVAL VENDOR
        const verifikator = rawList.find((p: any) => p.rfid_uid === idCard || p.id === idCard);
        
        if (!verifikator || verifikator.role !== "inventory man") {
          setScanError("Akses Ditolak! Hanya kartu ber-role 'Inventory Man' yang dapat menyetujui pengembalian Vendor.");
          return;
        }
        
        // Otorisasi berhasil, arahkan query ke barang milik Vendor
        targetPemintaId = pendingVendor.id;
        namaPeminta = pendingVendor.nama_peminta || "Vendor";
      } else {
        // 2. MODE NORMAL (Pegawai mengembalikan barangnya sendiri)
        const peminta = rawList.find((p: any) => p.rfid_uid === idCard || p.id === idCard);
        
        if (!peminta) {
          setScanError("Kartu tidak dikenali atau peminjam tidak aktif.");
          return;
        }

        if (peminta.kategori === "Vendor") {
          setScanError("Vendor tidak memiliki kartu. Silakan klik tombol 'Pengembalian Vendor'.");
          return;
        }

        // Arahkan query ke barang milik Pegawai tersebut
        targetPemintaId = peminta.id;
        namaPeminta = peminta.nama || peminta.nama_peminta || peminta.name || "Pengguna";
      }

      // Cari barang yang sedang dipinjam
      const milikPeminjamIni = items.filter((item) => item.peminjamId === targetPemintaId);

      if (milikPeminjamIni.length === 0) {
        setScanError(`${namaPeminta} tidak sedang meminjam alat ukur apa pun.`);
        return;
      }

      const grouped: PengembalianGroupItem[] = [];
      const records: Record<string, PeminjamanAktifItemType[]> = {};

      milikPeminjamIni.forEach((item) => {
        if (!records[item.alatUkurId]) {
          records[item.alatUkurId] = [];
          grouped.push({
            id: item.alatUkurId,
            toolId: item.alatUkurId,
            kodeBarang: item.kodeBarang,
            namaBarang: item.namaBarang,
            jumlah: 0,
          });
        }
        records[item.alatUkurId].push(item);
        const g = grouped.find((x) => x.id === item.alatUkurId)!;
        g.jumlah += item.jumlah;
      });

      Object.keys(records).forEach((alatUkurId) => {
        records[alatUkurId].reverse();
      });

      setSubmitError(null);
      setNamaPeminjamAktif(namaPeminta);
      setItemsPeminjam(grouped);
      setRecordsByGroup(records);
      
      // Bersihkan state otorisasi vendor
      setPendingVendor(null);
      setScanAuthModalOpen(false);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memverifikasi kartu";
      setScanError(message);
    } finally {
      setScanning(false);
    }
  };

  const handleBackToScan = () => {
    setNamaPeminjamAktif(null);
    setItemsPeminjam(null);
    setRecordsByGroup({});
    setScanError(null);
    setPendingVendor(null);
    setScanAuthModalOpen(false);
  };

  const handleSelectVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;
    
    const vendor = vendorList.find((v) => v.id === selectedVendorId);
    if (vendor) {
      setPendingVendor(vendor);
      setVendorModalOpen(false);
      setScanAuthModalOpen(true); // Buka modal otorisasi kartu
    }
  };

  // ---- Submit pengembalian sekaligus ----
  const handleBatchSubmit = async (batch: PengembalianBatchItem[]) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const dicatatOleh = localStorage.getItem("userId");

      for (const item of batch) {
        const batchId = item.id || (item as unknown as { alatUkurId: string }).alatUkurId;
        const records = recordsByGroup[batchId] || [];

        let sisaDikembalikan = item.jumlahDikembalikan;
        let poolBisaDiperbaiki = item.kerusakan.find((k: { jenisKerusakan: string }) => k.jenisKerusakan === "bisa_diperbaiki")?.jumlah ?? 0;
        let poolRusakPermanen = item.kerusakan.find((k: { jenisKerusakan: string }) => k.jenisKerusakan === "rusak_permanen")?.jumlah ?? 0;
        const catatanBisaDiperbaiki = item.kerusakan.find((k: { jenisKerusakan: string }) => k.jenisKerusakan === "bisa_diperbaiki")?.catatan ?? "";
        const catatanRusakPermanen = item.kerusakan.find((k: { jenisKerusakan: string }) => k.jenisKerusakan === "rusak_permanen")?.catatan ?? "";

        for (const record of records) {
          if (sisaDikembalikan <= 0) break;

          const ambil = Math.min(record.jumlah, sisaDikembalikan);

          // TANGKAP ID
          const realPeminjamanId = record.id || (record as any).peminjamanId || (record as any).id_peminjaman || (record as any).peminjaman_id;

          if (!realPeminjamanId || realPeminjamanId === 0 || realPeminjamanId === "0") {
            throw new Error("Gagal: ID Transaksi Peminjaman tidak ditemukan.");
          }

          await tandaiDikembalikan(String(realPeminjamanId));

          let terpakai = 0;
          const ambilBisaDiperbaiki = Math.min(poolBisaDiperbaiki, ambil);
          if (ambilBisaDiperbaiki > 0) {
            if (!dicatatOleh) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
            await createLaporanKerusakan({
              tanggal: new Date().toISOString(),
              alat_ukur_id: batchId,
              peminjaman_id: String(realPeminjamanId),
              jumlah: ambilBisaDiperbaiki,
              keterangan: catatanBisaDiperbaiki,
              status: "bisa_diperbaiki",
              dilaporkan_oleh: dicatatOleh,
            } as any);
            poolBisaDiperbaiki -= ambilBisaDiperbaiki;
            terpakai += ambilBisaDiperbaiki;
          }

          const ambilRusakPermanen = Math.min(poolRusakPermanen, ambil - terpakai);
          if (ambilRusakPermanen > 0) {
            if (!dicatatOleh) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
            await createLaporanKerusakan({
              tanggal: new Date().toISOString(),
              alat_ukur_id: batchId,
              peminjaman_id: String(realPeminjamanId),
              jumlah: ambilRusakPermanen,
              keterangan: catatanRusakPermanen,
              status: "rusak_permanen",
              dilaporkan_oleh: dicatatOleh,
            } as any);
            poolRusakPermanen -= ambilRusakPermanen;
          }

          sisaDikembalikan -= ambil;
        }
      }

      await loadData();

      const totalUnitRusak = batch.reduce(
        (sum: number, b: PengembalianBatchItem) => sum + b.kerusakan.reduce((s: number, k: { jumlah: number }) => s + k.jumlah, 0),
        0
      );
      setSuccessMessage(
        `${batch.length} alat ukur berhasil dikembalikan${
          totalUnitRusak > 0 ? ` (${totalUnitRusak} unit di antaranya ditandai rusak dan masuk Laporan Kerusakan)` : ""
        }.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);

      handleBackToScan();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memproses pengembalian";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const step = itemsPeminjam ? 2 : 1;
  const stepClass = (n: number) => (step === n ? "is-now" : step > n ? "is-done" : "");

  return (
    <div className="pengembalian-page pln-pg">
      <style>{CSS}</style>

      {successMessage && (
        <Alert variant="success" className="pg-msg" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} className="flex-shrink-0" />
          <span>{successMessage}</span>
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100 pg-head" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Pengembalian Alat Ukur</h1>
              <p className="text-secondary mb-2">
                Scan kartu peminjam, lalu centang alat ukur yang ingin dikembalikan sekaligus.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      {canProcess && (
        <div className="pg-steps" aria-label="Langkah pengembalian">
          <span className={`pg-step ${stepClass(1)}`}>
            <i>1</i> Scan kartu
          </span>
          <span className={`pg-step ${stepClass(2)}`}>
            <i>2</i> Pilih alat dan konfirmasi
          </span>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="pg-msg">
          <IconAlertTriangle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </Alert>
      )}

      {submitError && (
        <Alert variant="danger" className="pg-msg" dismissible onClose={() => setSubmitError(null)}>
          <IconAlertTriangle size={20} className="flex-shrink-0" />
          <span>{submitError}</span>
        </Alert>
      )}

      {!canProcess ? (
        <Alert variant="warning" className="pg-msg">
          <IconLock size={20} className="flex-shrink-0" />
          <span>
            Anda tidak memiliki akses untuk memproses pengembalian alat ukur. Hubungi Admin jika perlu.
          </span>
        </Alert>
      ) : loading ? (
        <div className="text-center py-6">
          <Spinner animation="border" size="sm" className="me-2" />
          Memuat data...
        </div>
      ) : !itemsPeminjam ? (
        <>
          <div className="d-flex justify-content-end mb-3">
             <Button variant="outline-primary" onClick={() => setVendorModalOpen(true)} className="d-flex align-items-center gap-2 fw-semibold bg-white shadow-sm">
                <IconBuildingStore size={18} /> Pengembalian Eksternal (Vendor)
             </Button>
          </div>
          <PengembalianAlatScanForm onScan={handleScan} loading={scanning && !scanAuthModalOpen} error={!scanAuthModalOpen ? scanError : null} />
        </>
      ) : (
        <PengembalianAlatChecklist
          namaPeminjam={namaPeminjamAktif || ""}
          items={itemsPeminjam}
          onBack={handleBackToScan}
          onSubmit={handleBatchSubmit}
          submitting={submitting}
        />
      )}

      {/* MODAL PILIH VENDOR */}
      <Modal show={vendorModalOpen} onHide={() => setVendorModalOpen(false)} centered backdropClassName="pln-alert-backdrop">
        <Form onSubmit={handleSelectVendorSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold" style={{color: '#06355f'}}>Pengembalian Eksternal</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="fw-semibold">Pilih Instansi Vendor</Form.Label>
              <Form.Select required value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)}>
                <option value="" disabled>-- Pilih Vendor --</option>
                {vendorList.map((v) => (
                  <option key={v.id} value={v.id}>{v.nama_peminta}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted mt-2 d-block">
                Setelah memilih vendor, sistem akan meminta otorisasi dari <b>Inventory Man</b> melalui scan kartu RFID.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setVendorModalOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit" disabled={!selectedVendorId}>Lanjutkan</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL OTORISASI SCAN KARTU INVENTORY MAN */}
      <Modal 
        show={scanAuthModalOpen} 
        onHide={() => { setScanAuthModalOpen(false); setPendingVendor(null); setScanError(null); }} 
        centered 
        backdrop="static"
        backdropClassName="pln-alert-backdrop"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 text-muted">Otorisasi Pengembalian</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
           {scanning ? (
             <>
               <Spinner animation="border" variant="primary" className="mb-3" />
               <h5>Memverifikasi Otorisasi...</h5>
             </>
           ) : (
             <>
               <div style={{width: 92, height: 92, background: '#e6f0fa', color: '#0b6bb8', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px'}}>
                 <IconId size={42} />
               </div>
               <h5 className="mb-2" style={{color: '#06355f', fontWeight: 800}}>Scan Kartu Inventory Man</h5>
               <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: 320 }}>
                 Pengembalian barang oleh vendor <b>{pendingVendor?.nama_peminta}</b> memerlukan persetujuan dari petugas Inventory Man.
               </p>
               <Form.Control
                 autoFocus
                 type="password"
                 placeholder="Tap kartu RFID ke reader..."
                 className="text-center"
                 onKeyDown={(e) => {
                   if (e.key === "Enter") {
                     e.preventDefault();
                     handleScan(e.currentTarget.value);
                     e.currentTarget.value = "";
                   }
                 }}
               />
               {scanError && <Alert variant="danger" className="mt-3 text-start mb-0">{scanError}</Alert>}
             </>
           )}
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default PengembalianManager;