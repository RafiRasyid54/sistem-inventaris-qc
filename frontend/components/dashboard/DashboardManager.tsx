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

// --- DATA DUMMY (SESUAIKAN DENGAN INTERFACE TYPESCRIPT) ---
const dummySummary: DashboardSummary = {
  total_alat_ukur: 142,
  sedang_dipinjam: 12,
  peringatan_kalibrasi: 5,
  total_peminta_aktif: 28,
  total_pekerjaan_aktif: 4, // Ditambahkan sesuai error TypeScript
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
    kode_alat: "AL-022", // Ditambahkan sesuai error TypeScript
    tanggal_pinjam: "2026-09-01" // Ditambahkan sesuai error TypeScript
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
    <Row>
      <Col>
        <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
          <div>
            <h1 className="mb-2 h2">Dashboard (Mode Dummy)</h1>
            <p className="text-secondary mb-0">
              Ringkasan aktivitas peminjaman dan status kalibrasi Alat Ukur.
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
        <div className="text-center py-6">Memuat dashboard...</div>
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
    <>
      {PageHeader}

      {/* Baris 1: Ringkasan Utama */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-alat-ukur" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconRuler2 size={26} />}
              title="Total Alat Ukur"
              value={summary?.total_alat_ukur ?? 0}
              variant="primary"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/transaksi/peminjaman-aktif" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconClockHour4 size={26} />}
              title="Sedang Dipinjam"
              value={summary?.sedang_dipinjam ?? 0}
              variant="warning"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-alat-ukur" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconAlertTriangle size={26} />}
              title="Peringatan Kalibrasi"
              value={summary?.peringatan_kalibrasi ?? 0}
              variant="danger"
            />
          </Link>
        </Col>
        <Col xs={6} md={6} xl={3}>
          <Link href="/inventaris/data-peminjam" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <StatCard
              icon={<IconUsers size={26} />}
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
          <Card className="card-lg h-100">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconAlertTriangle className="text-danger" size={20} />
                <h5 className="mb-0">Kalibrasi Jatuh Tempo / Mendekati</h5>
              </div>
              {kalibrasiMendekati.length === 0 ? (
                <p className="text-secondary small mb-0">Semua alat masih dalam masa kalibrasi aman.</p>
              ) : (
                <ul className="list-unstyled mb-0 dash-list">
                  {kalibrasiMendekati.map((item, idx) => (
                    <li
                      key={item.id ?? idx}
                      className="d-flex justify-content-between align-items-center px-2 py-2 rounded small border-bottom"
                    >
                      <div>
                        <div className="fw-semibold">
                          {item.nama_alat} <span className="text-secondary fw-normal">({item.kode_alat})</span>
                        </div>
                        {item.sn && (
                          <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                            SN: {item.sn}
                          </div>
                        )}
                      </div>
                      <Badge bg="warning">
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
          <Card className="card-lg h-100">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconClockHour4 className="text-warning" size={20} />
                <h5 className="mb-0">Belum Dikembalikan (Telat)</h5>
              </div>
              {telatKembali.length === 0 ? (
                <p className="text-secondary small mb-0">Tidak ada yang terlambat.</p>
              ) : (
                <ul className="list-unstyled mb-0 dash-list">
                  {telatKembali.map((item, idx) => (
                    <li key={item.id ?? idx} className="d-flex justify-content-between align-items-center px-2 py-2 rounded small border-bottom">
                      <span>
                        {item.nama_alat} — {item.nama_peminjam}
                      </span>
                      <Badge bg="danger">{item.hari_terlambat} hari</Badge>
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
          <Card className="card-lg h-100">
            <CardBody>
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconTrendingUp className="text-primary" size={20} />
                <h5 className="mb-0">Tren Peminjaman Alat Ukur (30 Hari Terakhir)</h5>
              </div>
              {tren.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={tren}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#555" opacity={0.3} />
                    <XAxis
                      dataKey="tanggal"
                      tickFormatter={(val) => {
                        if (!val) return "";
                        return new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
                      }}
                      fontSize={12}
                      stroke="#a0a0a0"
                    />
                    <YAxis allowDecimals={false} fontSize={12} stroke="#a0a0a0" />
                    <Tooltip
                      labelFormatter={(val) => {
                        if (!val) return "";
                        return new Date(String(val)).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#006492"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#006492" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Baris 4: Alat Paling Sering Dipinjam */}
      <Row className="g-3 mb-4">
        <Col xs={12}>
          <Card className="card-lg h-100">
            <CardBody>
              <h6 className="mb-3">Alat Paling Sering Dipinjam</h6>
              {alatTerpopuler.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada data.</p>
              ) : (
                <ul className="list-unstyled mb-0 dash-list">
                  {alatTerpopuler.map((item, idx) => (
                    <li key={item.kode_alat || idx} className="d-flex justify-content-between align-items-center px-2 py-2 rounded small border-bottom">
                      <div>
                        <div className="fw-semibold">
                          {item.nama_alat} <span className="text-secondary fw-normal">({item.kode_alat || "-"})</span>
                        </div>
                        <div className="text-secondary" style={{ fontSize: "0.75rem" }}>
                          {item.merk || "-"} {item.sn ? ` • SN: ${item.sn}` : ""}
                        </div>
                      </div>
                      <Badge bg="primary" className="rounded-pill px-2">
                        {item.total_dipinjam}x
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
          <Card className="card-lg h-100">
            <CardBody>
              <h5 className="mb-3">Aktivitas Terbaru</h5>
              {aktivitas.length === 0 ? (
                <p className="text-secondary small mb-0">Belum ada aktivitas.</p>
              ) : (
                <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: "5px" }}>
                  <ul className="list-unstyled mb-0 dash-list">
                    {aktivitas.map((item, idx) => (
                      <li key={`${item.waktu}-${idx}`} className="px-2 py-3 rounded border-bottom">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <div>
                            <div className="small fw-semibold">{item.deskripsi}</div>
                            <div className="text-secondary mt-1" style={{ fontSize: "0.75rem" }}>
                              {formatWaktu(item.waktu)}
                            </div>
                          </div>
                          <Badge bg={jenisLabel[item.jenis]?.color || "secondary"} className="flex-shrink-0 px-2 py-1">
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
      <Row className="g-3">
        <Col xs={12}>
          <Link
            href="/order/order-alat-ukur"
            style={{ textDecoration: "none", color: "inherit" }}
            className="d-block h-100"
            title="Ke Halaman Order Alat Ukur"
          >
            <Card className="card-lg h-100 border-primary border-opacity-25 shadow-sm" style={{ cursor: "pointer" }}>
              <CardBody>
                <h6 className="mb-4 d-flex align-items-center gap-2">
                  <IconShoppingCart size={20} className="text-primary" />
                  Rincian Status Order Alat Ukur
                </h6>
                <Row className="text-center">
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Belum Dibeli</div>
                    <div className="h4 mb-0 text-secondary">{orderAlatUkurStatus.belum_dibeli ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">On Progres</div>
                    <div className="h4 mb-0 text-primary">{orderAlatUkurStatus.on_progres ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Sudah Dibeli</div>
                    <div className="h4 mb-0 text-success">{orderAlatUkurStatus.sudah_dibeli ?? 0}</div>
                  </Col>
                  <Col xs={3}>
                    <div className="text-secondary small mb-1">Ditolak</div>
                    <div className="h4 mb-0 text-danger">{orderAlatUkurStatus.ditolak ?? 0}</div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Link>
        </Col>
      </Row>
      <div className="mb-5"></div>
    </>
  );
};

export default DashboardManager;