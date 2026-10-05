"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Spinner } from "react-bootstrap";
import {
  IconRuler2,
  IconUsers,
  IconClockHour4,
  IconAlertTriangle,
  IconRefresh,
  IconCircleCheck,
  IconArrowDownLeft,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import {
  DashboardSummary,
  KalibrasiMendekatiItem,
  TelatKembaliItem,
  AlatTerpopulerItem,
  AktivitasItem,
  TrenPeminjamanItem,
} from "types/DashboardTypes";

import apiFetch from "/lib/apiFetch";

const REFRESH_INTERVAL_MS = 15000; // 15 detik

// Isi dengan path logo resmi PLN (mis. "/images/logo-pln.png" di folder public).
// Kalau dikosongkan, dipakai ikon petir sederhana.
const LOGO_SRC = "";

const Bolt = ({ size = 30, color = "#0b6bb8" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M13.5 1 4 13.5h6L8.5 23 20 9.5h-6.5L13.5 1z" />
  </svg>
);

const formatWaktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatTanggal = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

function extractData<T>(res: any, fallback: T): T {
  if (res == null) return fallback;
  if (Array.isArray(res)) return res as unknown as T;
  if (res.data !== undefined) return res.data as T;
  return res as T;
}

// Isi hari tanpa peminjaman dengan 0 supaya grafik jujur (tidak "melompat" antar hari).
function isiHariKosong(tren: TrenPeminjamanItem[], hari = 30) {
  const map = new Map<string, number>();
  tren.forEach((t: any) => map.set(String(t.tanggal).slice(0, 10), Number(t.total) || 0));
  const out: { tanggal: string; total: number }[] = [];
  for (let i = hari - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ tanggal: key, total: map.get(key) ?? 0 });
  }
  return out;
}

const CSS = `
.dm{--ink:#14233b;--mute:#62708a;--line:#dbe5f1;--card:#fff;--blue:#0b6bb8;--navy:#06355f;--cyan:#00a7c4;--yellow:#ffc20e;--red:#e2231a;--ok:#12a36b;--orange:#f08a00;
  color:var(--ink);font-variant-numeric:tabular-nums}
.dm-hero{position:relative;overflow:hidden;border-radius:16px;padding:22px 26px 26px;margin-bottom:20px;color:#fff;
  background:linear-gradient(115deg,var(--navy) 0%,var(--blue) 62%,var(--cyan) 130%)}
.dm-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;background:linear-gradient(90deg,var(--yellow) 0 55%,var(--red) 55% 70%,var(--cyan) 70%)}
.dm-hero .bolt-bg{position:absolute;right:-10px;top:-30px;width:240px;height:240px;opacity:.12;transform:rotate(12deg)}
.dm-hero-in{position:relative;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center}
.dm-brand{display:flex;align-items:center;gap:16px}
.dm-logo{width:56px;height:56px;border-radius:14px;background:var(--yellow);display:grid;place-items:center;flex:none;box-shadow:0 6px 16px rgba(0,0,0,.25)}
.dm-logo img{width:40px;height:40px;object-fit:contain}
.dm-hero h1{font-size:1.5rem;font-weight:800;margin:0;color:#fff}
.dm-hero p{margin:2px 0 0;font-size:.85rem;color:#d6e8f8}
.dm-sync{display:flex;align-items:center;gap:10px;font-size:.8rem;color:#d6e8f8;flex-wrap:wrap}
.dm-live{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.14);padding:4px 10px;border-radius:99px;font-weight:600;color:#fff}
.dm-live i{width:8px;height:8px;border-radius:50%;background:#3ddc97;box-shadow:0 0 0 3px rgba(61,220,151,.3)}
.dm-btn{display:inline-flex;align-items:center;gap:6px;border:0;background:var(--yellow);border-radius:8px;
  padding:7px 14px;font-size:.8rem;font-weight:700;color:var(--navy);cursor:pointer}
.dm-btn:hover{filter:brightness(1.06)}
.dm-btn:disabled{opacity:.7}
.dm-btn:focus-visible,.dm-stat:focus-visible{outline:2px solid var(--yellow);outline-offset:2px}
.dm-bc{margin-bottom:10px}

.dm-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
.dm-stat{position:relative;overflow:hidden;display:flex;gap:14px;align-items:center;padding:18px 20px;border-radius:14px;text-decoration:none;color:#fff;
  transition:transform .15s}
.dm-stat:hover{transform:translateY(-2px);color:#fff}
.dm-stat .ic{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;flex:none;background:rgba(255,255,255,.22)}
.dm-stat .lb{font-size:.8rem;opacity:.92}
.dm-stat .vl{font-size:2rem;font-weight:800;line-height:1.1}
.dm-stat .ghost{position:absolute;right:-12px;bottom:-18px;opacity:.14}
.s-blue{background:linear-gradient(135deg,#0b6bb8,#2b8fe0)}
.s-yellow{background:linear-gradient(135deg,#ffb300,#ffd94a);color:#3a2a00}.s-yellow:hover{color:#3a2a00}
.s-yellow .ic{background:rgba(255,255,255,.4)}
.s-red{background:linear-gradient(135deg,#d41a14,#f2554b)}
.s-teal{background:linear-gradient(135deg,#008fa8,#18c3a4)}
.s-red.pulse::before{content:"";position:absolute;inset:0;border-radius:14px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)}

.dm-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:20px;align-items:start}
.dm-col{display:flex;flex-direction:column;gap:20px;min-width:0}
.dm-panel{background:var(--card);border:1px solid var(--line);border-top:4px solid var(--blue);border-radius:14px;padding:18px 20px 20px}
.dm-panel.k-yellow{border-top-color:var(--yellow)}.dm-panel.k-red{border-top-color:var(--red)}
.dm-panel.k-orange{border-top-color:var(--orange)}.dm-panel.k-teal{border-top-color:var(--cyan)}
.dm-panel h2{font-size:.95rem;font-weight:700;margin:0;display:flex;align-items:center;gap:8px;color:var(--navy)}
.dm-panel .sub{font-size:.78rem;color:var(--mute);margin:2px 0 14px}
.dm-count{margin-left:auto;font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:99px}
.dm-empty{display:flex;align-items:center;gap:8px;font-size:.82rem;color:#0b7a50;padding:10px 12px;background:#e3f7ee;border-radius:8px;margin-top:12px}
.dm-empty.neutral{color:var(--mute);background:#eef3f9}

.dm-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}
.dm-row:last-child{border-bottom:0}
.dm-row .nm{font-size:.85rem;font-weight:600}
.dm-row .mt{font-size:.75rem;color:var(--mute)}
.dm-pill{font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:99px;white-space:nowrap}
.p-warn{background:#fff0c2;color:#7a5500}.p-bad{background:#fde1df;color:#a8160f}

.dm-rank{display:grid;grid-template-columns:28px 1fr auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.dm-rank:last-child{border-bottom:0}
.dm-rank .no{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-size:.8rem;font-weight:800;background:#e6f0fa;color:var(--blue)}
.dm-rank:nth-child(3) .no{background:var(--yellow);color:var(--navy)}
.dm-rank:nth-child(4) .no{background:#e6f0fa}
.dm-bar{height:6px;border-radius:99px;background:#e6f0fa;margin-top:6px;overflow:hidden}
.dm-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--blue),var(--cyan));border-radius:99px}

.dm-tl{max-height:420px;overflow-y:auto;margin:0;padding:0;list-style:none}
.dm-tl li{display:flex;gap:12px;padding:0 0 16px;position:relative}
.dm-tl li::before{content:"";position:absolute;left:13px;top:28px;bottom:0;width:1px;background:var(--line)}
.dm-tl li:last-child::before{display:none}
.dm-tl .dot{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;flex:none}
.d-out{background:#fff0c2;color:#9a6a00}.d-in{background:#dcf4ea;color:#0b7a50}
.dm-tl .tx{font-size:.84rem;font-weight:600;line-height:1.35}
.dm-tl .tm{font-size:.73rem;color:var(--mute)}

@media (max-width:1199px){.dm-grid{grid-template-columns:1fr}}
@media (max-width:991px){.dm-strip{grid-template-columns:repeat(2,1fr)}}
@media (max-width:480px){.dm-strip{grid-template-columns:1fr}.dm-hero{padding:18px}}
`;

const DashboardManager = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [kalibrasiMendekati, setKalibrasiMendekati] = useState<KalibrasiMendekatiItem[]>([]);
  const [telatKembali, setTelatKembali] = useState<TelatKembaliItem[]>([]);
  const [alatTerpopuler, setAlatTerpopuler] = useState<AlatTerpopulerItem[]>([]);
  const [aktivitas, setAktivitas] = useState<AktivitasItem[]>([]);
  const [tren, setTren] = useState<TrenPeminjamanItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstLoadRef = useRef(true);

  const loadDashboard = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const [summaryRes, kalibrasiRes, telatRes, terpopulerRes, aktivitasRes, trenRes] = await Promise.all([
        apiFetch<any>("/dashboard/summary"),
        apiFetch<any>("/dashboard/kalibrasi-mendekati"),
        apiFetch<any>("/dashboard/telat-kembali"),
        apiFetch<any>("/dashboard/alat-terpopuler"),
        apiFetch<any>("/dashboard/aktivitas-terbaru"),
        apiFetch<any>("/dashboard/tren-peminjaman"),
      ]);

      setSummary(extractData<DashboardSummary>(summaryRes, null as any));
      setKalibrasiMendekati(extractData<KalibrasiMendekatiItem[]>(kalibrasiRes, []));
      setTelatKembali(extractData<TelatKembaliItem[]>(telatRes, []));
      setAlatTerpopuler(extractData<AlatTerpopulerItem[]>(terpopulerRes, []));
      setAktivitas(extractData<AktivitasItem[]>(aktivitasRes, []));
      setTren(extractData<TrenPeminjamanItem[]>(trenRes, []));
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isFirstLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const id = setInterval(loadDashboard, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadDashboard]);

  const trenPenuh = useMemo(() => isiHariKosong(tren, 30), [tren]);
  const totalTren = trenPenuh.reduce((a, b) => a + b.total, 0);
  const maxPopuler = Math.max(1, ...alatTerpopuler.map((a) => Number(a.total_dipinjam) || 0));

  const header = (
    <>
      <div className="dm-hero">
        <span className="bolt-bg"><Bolt size={240} color="#fff" /></span>
        <div className="dm-hero-in">
          <div className="dm-brand">
            <span className="dm-logo">
              {LOGO_SRC ? <img src={LOGO_SRC} alt="Logo PLN" /> : <Bolt />}
            </span>
            <div>
              <h1>Dashboard Pengelola</h1>
              <p>Peminjaman dan kalibrasi alat ukur PLN, dipantau langsung.</p>
            </div>
          </div>
          <div className="dm-sync">
            <span className="dm-live"><i /> Live &middot; {REFRESH_INTERVAL_MS / 1000} dtk</span>
            {isRefreshing && <Spinner animation="border" size="sm" />}
            <span>{lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID")}` : "Memuat..."}</span>
            <button type="button" className="dm-btn" onClick={loadDashboard} disabled={isRefreshing}>
              <IconRefresh size={14} /> Muat ulang
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="dm py-2">
        <style>{CSS}</style>
        {header}
        <div className="text-center py-5 text-muted">
          <Spinner animation="border" size="sm" className="me-2" />
          Memuat data dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dm py-2">
        <style>{CSS}</style>
        {header}
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button type="button" className="dm-btn" onClick={loadDashboard}>Coba lagi</button>
        </Alert>
      </div>
    );
  }

  const peringatan = summary?.peringatan_kalibrasi ?? 0;

  const stats = [
    { href: "/inventaris/data-alat-ukur", icon: <IconRuler2 size={24} />, label: "Total alat ukur", value: summary?.total_alat_ukur ?? 0, cls: "s-blue" },
    { href: "/transaksi/peminjaman-aktif", icon: <IconClockHour4 size={24} />, label: "Sedang dipinjam", value: summary?.sedang_dipinjam ?? 0, cls: "s-yellow" },
    { href: "/inventaris/data-alat-ukur", icon: <IconAlertTriangle size={24} />, label: "Perlu kalibrasi", value: peringatan, cls: peringatan > 0 ? "s-red pulse" : "s-red" },
    { href: "/inventaris/data-peminjam", icon: <IconUsers size={24} />, label: "Peminjam aktif", value: summary?.total_peminta_aktif ?? 0, cls: "s-teal" },
  ];

  return (
    <div className="dm py-2">
      <style>{CSS}</style>
      {header}

      {/* Ringkasan: satu strip, bukan empat kartu terpisah */}
      <div className="dm-strip">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`dm-stat ${s.cls}`}>
            <span className="ic">{s.icon}</span>
            <span>
              <div className="lb">{s.label}</div>
              <div className="vl">{s.value}</div>
            </span>
            <span className="ghost"><Bolt size={96} color="#fff" /></span>
          </Link>
        ))}
      </div>

      <div className="dm-grid">
        {/* Kolom kiri: tren + alat terpopuler + aktivitas */}
        <div className="dm-col">
          <section className="dm-panel">
            <h2>Peminjaman 30 hari terakhir</h2>
            <p className="sub">{totalTren} peminjaman dalam sebulan terakhir</p>
            {totalTren === 0 ? (
              <div className="dm-empty neutral">Belum ada peminjaman dalam 30 hari terakhir.</div>
            ) : (
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trenPenuh} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="plnBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffc20e" />
                        <stop offset="100%" stopColor="#0b6bb8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe5f1" />
                    <XAxis
                      dataKey="tanggal"
                      tickFormatter={(v) => new Date(String(v)).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                      interval={4}
                      fontSize={11}
                      stroke="#6b7685"
                      tickLine={false}
                    />
                    <YAxis allowDecimals={false} fontSize={11} stroke="#6b7685" tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "#eef3f9" }}
                      formatter={(v: any) => [`${v} peminjaman`, ""]}
                      labelFormatter={(v) =>
                        new Date(String(v)).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
                      }
                    />
                    <Bar dataKey="total" fill="url(#plnBar)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="dm-panel k-yellow">
            <h2>Alat paling sering dipinjam</h2>
            <p className="sub">Diurutkan dari jumlah peminjaman terbanyak</p>
            {alatTerpopuler.length === 0 ? (
              <div className="dm-empty neutral">Belum ada data peminjaman.</div>
            ) : (
              alatTerpopuler.map((item, idx) => {
                const n = Number(item.total_dipinjam) || 0;
                return (
                  <div className="dm-rank" key={item.kode_alat || idx}>
                    <span className="no">{idx + 1}</span>
                    <div>
                      <div className="nm" style={{ fontSize: ".85rem", fontWeight: 600 }}>
                        {item.nama_alat} <span className="mt" style={{ fontWeight: 400, color: "var(--mute)" }}>({item.kode_alat || "-"})</span>
                      </div>
                      <div className="mt" style={{ fontSize: ".75rem", color: "var(--mute)" }}>
                        {item.merk || "-"}
                        {item.sn ? ` • SN: ${item.sn}` : ""}
                      </div>
                      <div className="dm-bar"><i style={{ width: `${(n / maxPopuler) * 100}%` }} /></div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: ".85rem" }}>{n}x</span>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* Kolom kanan: yang butuh tindakan + aktivitas */}
        <div className="dm-col">
          <section className="dm-panel k-red">
            <h2>
              <IconAlertTriangle size={18} color="#e2231a" /> Kalibrasi jatuh tempo
              {kalibrasiMendekati.length > 0 && <span className="dm-count p-bad">{kalibrasiMendekati.length}</span>}
            </h2>
            {kalibrasiMendekati.length === 0 ? (
              <div className="dm-empty"><IconCircleCheck size={16} /> Semua alat masih dalam masa kalibrasi aman.</div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {kalibrasiMendekati.map((item, idx) => (
                  <div className="dm-row" key={item.id ?? idx}>
                    <div>
                      <div className="nm">{item.nama_alat} <span className="mt">({item.kode_alat})</span></div>
                      {item.sn && <div className="mt">SN: {item.sn}</div>}
                    </div>
                    <span className="dm-pill p-warn">{formatTanggal(item.tanggal_kalibrasi_selanjutnya)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dm-panel k-orange">
            <h2>
              <IconClockHour4 size={18} color="#f08a00" /> Belum dikembalikan
              {telatKembali.length > 0 && <span className="dm-count p-bad">{telatKembali.length}</span>}
            </h2>
            {telatKembali.length === 0 ? (
              <div className="dm-empty"><IconCircleCheck size={16} /> Tidak ada peminjaman yang terlambat.</div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {telatKembali.map((item, idx) => (
                  <div className="dm-row" key={item.id ?? idx}>
                    <div>
                      <div className="nm">{item.nama_alat}</div>
                      <div className="mt">{item.nama_peminjam}</div>
                    </div>
                    <span className="dm-pill p-bad">Telat {item.hari_terlambat} hari</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dm-panel k-teal">
            <h2>Aktivitas terbaru</h2>
            <p className="sub">Peminjaman dan pengembalian terakhir</p>
            {aktivitas.length === 0 ? (
              <div className="dm-empty neutral">Belum ada aktivitas.</div>
            ) : (
              <ul className="dm-tl">
                {aktivitas.map((item, idx) => {
                  const pinjam = item.jenis === "peminjaman";
                  return (
                    <li key={`${item.waktu}-${idx}`}>
                      <span className={`dot ${pinjam ? "d-out" : "d-in"}`}>
                        {pinjam ? <IconArrowUpRight size={14} /> : <IconArrowDownLeft size={14} />}
                      </span>
                      <div>
                        <div className="tx">{item.deskripsi}</div>
                        <div className="tm">{formatWaktu(item.waktu)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardManager;