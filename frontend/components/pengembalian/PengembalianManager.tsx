"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Row, Col, Alert, Spinner } from "react-bootstrap";
import { IconCircleCheck, IconAlertTriangle, IconLock } from "@tabler/icons-react";
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
  // Error saat proses pengembalian ditampilkan di halaman, bukan alert() browser
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPeminjamanAktif();
      setItems(data);
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

  // ---- Scan kartu peminjam ----
  const handleScan = async (idCard: string) => {
    setScanning(true);
    setScanError(null);
    try {
      const pemintaAktif = await getPeminta();
      const peminta: any = pemintaAktif.find((p: { id: string }) => p.id === idCard);

      if (!peminta) {
        setScanError("Kartu tidak dikenali atau peminjam tidak aktif.");
        return;
      }

      const namaPeminta =
        peminta.nama ||
        peminta.nama_peminta ||
        peminta.name ||
        peminta.username ||
        peminta.nama_lengkap ||
        "Pengguna";

      const milikPeminjamIni = items.filter((item) => item.peminjamId === idCard);

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

          // Jika ID tidak ditemukan, isi data asli dari backend dicatat di console untuk debugging
          if (!realPeminjamanId || realPeminjamanId === 0 || realPeminjamanId === "0") {
            console.error("ISI DATA DARI BACKEND (ID peminjaman tidak ditemukan):", JSON.stringify(record, null, 2));
            throw new Error("Gagal: ID Transaksi Peminjaman tidak ditemukan dari data API backend. Detail data ada di console browser.");
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

  // Langkah alur saat ini: 1 scan kartu, 2 pilih alat dan konfirmasi
  const step = itemsPeminjam ? 2 : 1;
  const stepClass = (n: number) => (step === n ? "is-now" : step > n ? "is-done" : "");

  return (
    <div className="pengembalian-page pln-pg">
      <style>{CSS}</style>

      {successMessage && (
        <Alert
          variant="success"
          className="pg-msg"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} className="flex-shrink-0" />
          <span>{successMessage}</span>
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100 pg-head"
            breakpoint="md"
          >
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
        <PengembalianAlatScanForm onScan={handleScan} loading={scanning} error={scanError} />
      ) : (
        <PengembalianAlatChecklist
          namaPeminjam={namaPeminjamAktif || ""}
          items={itemsPeminjam}
          onBack={handleBackToScan}
          onSubmit={handleBatchSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default PengembalianManager;