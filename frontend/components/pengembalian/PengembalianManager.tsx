"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { Row, Col, Alert, Spinner } from "react-bootstrap";
import { IconCircleCheck } from "@tabler/icons-react";
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

      // FIX: fallback chain, sama seperti di DataAlatUkurManager.verifyCard
      // karena API /peminta kadang tidak selalu mengembalikan field "nama"
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

      // Gabungkan alat ukur yang sama (dipinjam di transaksi berbeda) jadi 1 baris
      const grouped: PengembalianGroupItem[] = [];
      const records: Record<string, PeminjamanAktifItemType[]> = {};

      milikPeminjamIni.forEach((item) => {
        if (!records[item.alatUkurId]) {
          records[item.alatUkurId] = [];
          grouped.push({
            id: item.alatUkurId,
            toolId: item.alatUkurId,       // FIX: dulu field ini gak pernah di-set
            kodeBarang: item.kodeBarang,   // FIX: dulu "kodeAlat" (salah, gak match interface)
            namaBarang: item.namaBarang,   // FIX: dulu "namaAlat" (salah, gak match interface)
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

      setNamaPeminjamAktif(namaPeminta); // FIX: pakai hasil fallback, bukan peminta.nama polos
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
    try {
      const dicatatOleh = localStorage.getItem("userId");

      for (const item of batch) {
        // Handle properti id/alatUkurId dari PengembalianBatchItem dengan aman
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

          // FIX (dari pembahasan sebelumnya): argumen kedua tandaiDikembalikan
          // seharusnya catatan (string), bukan jumlah (number) — sebelumnya "ambil as any"
          await tandaiDikembalikan(String(record.id));

          let terpakai = 0;
          const ambilBisaDiperbaiki = Math.min(poolBisaDiperbaiki, ambil);
          if (ambilBisaDiperbaiki > 0) {
            if (!dicatatOleh) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
            await createLaporanKerusakan({
              tanggal: new Date().toISOString(),
              alat_ukur_id: batchId,
              peminjaman_id: String(record.id),
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
              peminjaman_id: String(record.id),
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
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pengembalian-page">
      {successMessage && (
        <Alert
          variant="success"
          className="d-flex align-items-center gap-2"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex
            justifyContent="between"
            alignItems="center"
            className="mb-4 w-100"
            breakpoint="md"
          >
            <div>
              <h1 className="mb-2 h2">Pengembalian Alat Ukur</h1>
              <p className="text-secondary mb-0">
                Scan kartu peminjam, lalu centang alat ukur yang ingin dikembalikan sekaligus.
              </p>
              <DasherBreadcrumb />
            </div>
          </Flex>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {!canProcess ? (
        <Alert variant="warning">
          Anda tidak memiliki akses untuk memproses pengembalian alat ukur. Hubungi Admin jika perlu.
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