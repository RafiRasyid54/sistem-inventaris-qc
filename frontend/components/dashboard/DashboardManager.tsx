"use client";
import { useState } from "react";
import Link from "next/link";
import { Row, Col, Card, CardBody, Alert, Badge } from "react-bootstrap";
import {
  IconRuler2,
  IconUsers,
  IconClockHour4,
  IconAlertTriangle,
  IconTrendingUp,
  IconShoppingCart,
} from "@tabler/icons-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  DashboardSummary,
  KalibrasiMendekatiItem,
  TelatKembaliItem,
  AlatTerpopulerItem,
  AktivitasItem,
  TrenPeminjamanItem,
  OrderAlatUkurStatusCount,
} from "types/DashboardTypes";

import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import StatCard from "components/dashboard/StatCard";

const formatWaktu = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const jenisLabel: Record<AktivitasItem["jenis"], { label: string; color: string }> = {
  peminjaman: { label: "Peminjaman", color: "primary" },
  pengembalian: { label: "Pengembalian", color: "success" },
};

// --- DATA DUMMY ---
const dummySummary: DashboardSummary = {
  total_alat_ukur: 142,
  sedang_dipinjam: 12,
  peringatan_kalibrasi: 5,
  total_peminta_aktif: 28,
  total_pekerjaan_aktif: 4,
  order_alat_ukur_status: {
    belum_dibeli: 3,
    on_progres: 2,
    sudah_dibeli: 15,
    ditolak: 1,
  } as OrderAlatUkurStatusCount,
};

const dummyKalibrasi: KalibrasiMendekatiItem[] = [
  { id: 1, nama_alat: "Digital Caliper 150mm", kode_alat: "AL-001", sn: "SN987654", tanggal_kalibrasi_selanjutnya: "2026-10-15" },
  { id: 2, nama_alat: "Micrometer Outside", kode_alat: "AL-014", sn: "SN112233", tanggal_kalibrasi_selanjutnya: "2026-10-20" },
];

const dummyTelat: TelatKembaliItem[] = [
  { 
    id: 101, 
    nama_alat: "Dial Indicator", 
    nama_peminjam: "Ahmad Fauzi", 
    hari_terlambat: 3,
    kode_alat: "AL-022",
    tanggal_pinjam: "2026-09-01"
  },
];

const dummyAlatTerpopuler: AlatTerpopulerItem[] = [
  { kode_alat: "AL-001", nama_alat: "Digital Caliper 150mm", merk: "Mitutoyo", sn: "SN987654", total_dipinjam: 24 },
  { kode_alat: "AL-005", nama_alat: "Digital Multimeter", merk: "Fluke", sn: "SN554433", total_dipinjam: 18 },
];

const dummyAktivitas: AktivitasItem[] = [
  { waktu: "2026-09-17T10:30:00Z", deskripsi: "Budi meminjam Digital Caliper 150mm", jenis: "peminjaman" },
  { waktu: "2026-09-17T09:15:00Z", deskripsi: "Siti mengembalikan Micrometer Outside", jenis: "pengembalian" },
];

const dummyTren: TrenPeminjamanItem[] = [
  { tanggal: "2026-09-01", total: 2 },
  { tanggal: "2026-09-05", total: 5 },
  { tanggal: "2026-09-10", total: 3 },
  { tanggal: "2026-09-15", total: 8 },
];

const DashboardManager = () => {
  const [summary] = useState<DashboardSummary | null>(dummySummary);
  const [kalibrasiMendekati] = useState<KalibrasiMendekatiItem[]>(dummyKalibrasi);
  const [telatKembali] = useState<TelatKembaliItem[]>(dummyTelat);
  const [alatTerpopuler] = useState<AlatTerpopulerItem[]>(dummyAlatTerpopuler);
  const [aktivitas] = useState<AktivitasItem[]>(dummyAktivitas);
  const [tren] = useState<TrenPeminjamanItem[]>(dummyTren);

  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const PageHeader = (
    <Row className="mb-4 align-items-center">
      <Col>
        <Flex justifyContent="between" alignItems="center" className="w-100" breakpoint="md">
          <div>
            <h1 className="h3 mb-1 fw-bold text-dark">Dashboard Pengelola</h1>
            <p className="text-muted small mb-2">
              Ringkasan aktivitas peminjaman dan status kalibrasi Alat Ukur secara real-time.
            </p>
            <DasherBreadcrumb />
          </div>
        </Flex>
      </Col>
    </Row>
  );

  if (loading) {
    return (
      <>
        {PageHeader}
        <div className="text-center py-5 text-muted">Memuat data dashboard...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {PageHeader}
        <Alert variant="danger">{error}</Alert>
      </>
    );
  }

  const orderAlatUkurStatus: Partial<OrderAlatUkurStatusCount> = summary?.order_alat_ukur_status ?? {};

  return (
    <div className="py-2">
      {PageHeader}

      {/* Baris 1: Ringkasan Utama */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-alat-ukur" className="text-decoration-none">
            <StatCard
              icon={<IconRuler2 size={24} />}
              title="Total Alat Ukur"
              value={summary?.total_alat_ukur ?? 0}
              variant="primary"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/transaksi/peminjaman-aktif" className="text-decoration-none">
            <StatCard
              icon={<IconClockHour4 size={24} />}
              title="Sedang Dipinjam"
              value={summary?.sedang_dipinjam ?? 0}
              variant="warning"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-alat-ukur" className="text-decoration-none">
            <StatCard
              icon={<IconAlertTriangle size={24} />}
              title="Peringatan Kalibrasi"
              value={summary?.peringatan_kalibrasi ?? 0}
              variant="danger"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-peminjam" className="text-decoration-none">
            <StatCard
              icon={<IconUsers size={24} />}
              title="Total Peminjam Aktif"
              value={summary?.total_peminta_aktif ?? 0}
              variant="success"
            />
          </Link>
        </Col>
      </Row>

      {/* Baris 2: Alert (Kalibrasi & Telat) */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <CardBody className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconAlertTriangle className="text-danger" size={20} />
                <h5 className="mb-0 fs-6 fw-bold">Kalibrasi Jatuh Tempo / Mendekati</h5>
              </div>
              {kalibrasiMendekati.length === 0 ? (
                <p className="text-muted small mb-0">Semua alat masih dalam masa kalibrasi aman.</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {kalibrasiMendekati.map((item, idx) => (
                    <li
                      key={item.id ?? idx}
                      className="d-flex justify-content-between align-items-center py-2 px-2 rounded-2 border-bottom hover-bg"
                    >
                      <div>
                        <div className="fw-semibold small text-dark">
                          {item.nama_alat} <span className="text-muted fw-normal">({item.kode_alat})</span>
                        </div>
                        {item.sn && (
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            SN: {item.sn}
                          </div>
                        )}
                      </div>
                      <Badge bg="warning" text="dark" className="px-2 py-1">
                        {item.tanggal_kalibrasi_selanjutnya
                          ? new Date(item.tanggal_kalibrasi_selanjutnya).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <CardBody className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconClockHour4 className="text-warning" size={20} />
                <h5 className="mb-0 fs-6 fw-bold">Belum Dikembalikan (Telat)</h5>
              </div>
              {telatKembali.length === 0 ? (
                <p className="text-muted small mb-0">Tidak ada peminjaman yang terlambat.</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {telatKembali.map((item, idx) => (
                    <li key={item.id ?? idx} className="d-flex justify-content-between align-items-center py-2 px-2 rounded-2 border-bottom">
                      <span className="small text-dark fw-medium">
                        {item.nama_alat} <span className="text-muted">— {item.nama_peminjam}</span>
                      </span>
                      <Badge bg="danger" className="px-2 py-1">{item.hari_terlambat} hari</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 3: Grafik Tren Peminjaman */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm rounded-3">
            <CardBody className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconTrendingUp className="text-primary" size={20} />
                <h5 className="mb-0 fs-6 fw-bold">Tren Peminjaman Alat Ukur (30 Hari Terakhir)</h5>
              </div>
              {tren.length === 0 ? (
                <p className="text-muted small mb-0">Belum ada data tren.</p>
              ) : (
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tren}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                      <XAxis
                        dataKey="tanggal"
                        tickFormatter={(val) => {
                          if (!val) return "";
                          return new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
                        }}
                        fontSize={12}
                        stroke="#6c757d"
                      />
                      <YAxis allowDecimals={false} fontSize={12} stroke="#6c757d" />
                      <Tooltip
                        labelFormatter={(val) => {
                          if (!val) return "";
                          return new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#0d6efd"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#0d6efd" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 4: Alat Paling Sering Dipinjam */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm rounded-3">
            <CardBody className="p-4">
              <h6 className="mb-3 fs-6 fw-bold">Alat Paling Sering Dipinjam</h6>
              {alatTerpopuler.length === 0 ? (
                <p className="text-muted small mb-0">Belum ada data.</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {alatTerpopuler.map((item, idx) => (
                    <li key={item.kode_alat || idx} className="d-flex justify-content-between align-items-center py-2 px-2 border-bottom">
                      <div>
                        <div className="fw-semibold small text-dark">
                          {item.nama_alat} <span className="text-muted fw-normal">({item.kode_alat || "-"})</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {item.merk || "-"} {item.sn ? ` • SN: ${item.sn}` : ""}
                        </div>
                      </div>
                      <Badge bg="light" text="primary" className="border px-2 py-1 rounded-pill fw-semibold">
                        {item.total_dipinjam}x dipinjam
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 5: Aktivitas Terbaru */}
      <Row className="g-3 mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm rounded-3">
            <CardBody className="p-4">
              <h5 className="mb-3 fs-6 fw-bold">Aktivitas Terbaru</h5>
              {aktivitas.length === 0 ? (
                <p className="text-muted small mb-0">Belum ada aktivitas.</p>
              ) : (
                <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: "5px" }}>
                  <ul className="list-unstyled mb-0">
                    {aktivitas.map((item, idx) => (
                      <li key={`${item.waktu}-${idx}`} className="py-2 px-2 border-bottom">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <div>
                            <div className="small fw-semibold text-dark">{item.deskripsi}</div>
                            <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                              {formatWaktu(item.waktu)}
                            </div>
                          </div>
                          <Badge bg={jenisLabel[item.jenis]?.color || "secondary"} className="px-2 py-1">
                            {jenisLabel[item.jenis]?.label || item.jenis}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 6: Rincian Order Alat Ukur */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Link
            href="/order/order-alat-ukur"
            className="text-decoration-none d-block"
          >
            <Card className="border border-primary border-opacity-25 shadow-sm rounded-3 hover-shadow transition-all">
              <CardBody className="p-4">
                <h6 className="mb-3 d-flex align-items-center gap-2 fs-6 fw-bold text-dark">
                  <IconShoppingCart size={20} className="text-primary" />
                  Rincian Status Order Alat Ukur
                </h6>
                <Row className="text-center g-2">
                  <Col xs={3}>
                    <div className="text-muted small mb-1">Belum Dibeli</div>
                    <div className="h5 mb-0 text-secondary fw-bold">{orderAlatUkurStatus.belum_dibeli ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-muted small mb-1">On Progres</div>
                    <div className="h5 mb-0 text-primary fw-bold">{orderAlatUkurStatus.on_progres ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-muted small mb-1">Sudah Dibeli</div>
                    <div className="h5 mb-0 text-success fw-bold">{orderAlatUkurStatus.sudah_dibeli ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-muted small mb-1">Ditolak</div>
                    <div className="h5 mb-0 text-danger fw-bold">{orderAlatUkurStatus.ditolak ?? 0}</div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardManager;