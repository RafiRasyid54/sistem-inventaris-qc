"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Row, Col, Spinner, Badge, Alert, InputGroup, Form } from "react-bootstrap";
import { IconX, IconShieldLock, IconUsers, IconAlertTriangle, IconSearch } from "@tabler/icons-react";

import { getUsers } from "services/userService";
import { UserItemType, UserRole } from "types/DataUserTypes";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";

const C = {
  navy: "#06355f",
  blue: "#0b6bb8",
  line: "#dbe5f1",
  mute: "#62708a",
  head: "#eef3f9",
};

const ROLES: { key: UserRole; label: string; desc: string; color: string }[] = [
  { key: "admin", label: "Admin", desc: "Akses penuh, termasuk kelola user dan hapus data.", color: "#c0392b" },
  { key: "petugas", label: "Petugas", desc: "Operasional harian: peminjaman, kalibrasi, laporan.", color: C.blue },
  { key: "viewer", label: "Viewer", desc: "Hanya melihat data (read-only).", color: "#6c757d" },
];

type Level = "none" | "view" | "edit" | "full";

const LEVEL_UI: Record<Exclude<Level, "none">, { label: string; bg: string; fg: string }> = {
  view: { label: "Lihat", bg: "#eef1f5", fg: "#4a5568" },
  edit: { label: "Tambah/Ubah", bg: "#e1effb", fg: C.blue },
  full: { label: "Penuh", bg: "#e3f4ea", fg: "#198754" },
};

// Kolom modul + level akses per role. Samakan dengan cek role di controller.
const MODULES: { key: string; label: string; access: Record<UserRole, Level> }[] = [
  { key: "alat", label: "Alat Ukur", access: { admin: "full", petugas: "edit", viewer: "view" } },
  { key: "kalibrasi", label: "Kalibrasi", access: { admin: "full", petugas: "edit", viewer: "view" } },
  { key: "peminjaman", label: "Peminjaman", access: { admin: "full", petugas: "edit", viewer: "view" } },
  { key: "peminta", label: "Peminjam", access: { admin: "full", petugas: "edit", viewer: "view" } },
  { key: "pekerjaan", label: "Pekerjaan", access: { admin: "full", petugas: "view", viewer: "view" } },
  { key: "laporan", label: "Laporan", access: { admin: "full", petugas: "edit", viewer: "view" } },
  { key: "user", label: "Kelola User", access: { admin: "full", petugas: "none", viewer: "none" } },
];

const thStyle: React.CSSProperties = {
  background: C.head,
  color: C.navy,
  fontSize: ".72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".02em",
  borderBottom: `1px solid ${C.line}`,
  padding: ".75rem .8rem",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: ".65rem .8rem",
  fontSize: ".85rem",
  color: "#14233b",
  verticalAlign: "middle",
  borderBottom: `1px solid ${C.line}`,
};

const roleMeta = (role: UserRole) => ROLES.find((r) => r.key === role);

const RoleMatrix = () => {
  const [users, setUsers] = useState<UserItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setUsers(await getUsers());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data user");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeCountByRole = useMemo(() => {
    const map: Record<UserRole, number> = { admin: 0, petugas: 0, viewer: 0 };
    users.forEach((u) => {
      if (u.is_active && u.role in map) map[u.role] += 1;
    });
    return map;
  }, [users]);

  // Aktif dulu, lalu urut role (admin, petugas, viewer), lalu nama
  const rows = useMemo(() => {
    const order: Record<string, number> = { admin: 0, petugas: 1, viewer: 2 };
    const keyword = search.trim().toLowerCase();
    return users
      .filter(
        (u) =>
          keyword === "" ||
          u.full_name.toLowerCase().includes(keyword) ||
          u.username.toLowerCase().includes(keyword) ||
          (u.role ?? "").toLowerCase().includes(keyword)
      )
      .sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        if (a.role !== b.role) return (order[a.role] ?? 9) - (order[b.role] ?? 9);
        return a.full_name.localeCompare(b.full_name);
      });
  }, [users, search]);

  return (
    <div style={{ maxWidth: "100%" }}>
      <div className="mb-4">
        <h1 className="mb-2 h2" style={{ fontWeight: 800, color: C.navy }}>
          Matriks Hak Akses (RBAC)
        </h1>
        <p className="text-secondary mb-2" style={{ maxWidth: 640 }}>
          Hak akses setiap user sesuai role-nya. Data diambil langsung dari Manajemen User.
        </p>
        <DasherBreadcrumb />
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          style={{ border: 0, borderRadius: 12, display: "flex", alignItems: "center", gap: 10, fontSize: ".88rem" }}
        >
          <IconAlertTriangle size={20} />
          <span>{error}</span>
        </Alert>
      )}

      <Row className="g-3 mb-4">
        {ROLES.map((r) => (
          <Col md={4} key={r.key}>
            <Card style={{ borderRadius: 16, border: `1px solid ${C.line}`, borderTop: `4px solid ${r.color}`, height: "100%" }}>
              <CardBody>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2" style={{ color: C.navy, fontWeight: 800 }}>
                    <IconShieldLock size={20} color={r.color} />
                    {r.label}
                  </div>
                  <Badge bg="light" text="dark" className="rounded-pill d-inline-flex align-items-center gap-1">
                    <IconUsers size={14} />
                    {loading ? <Spinner animation="border" size="sm" /> : activeCountByRole[r.key]}
                  </Badge>
                </div>
                <p className="mb-0 small" style={{ color: C.mute }}>
                  {r.desc}
                </p>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 16, border: `1px solid ${C.line}`, borderTop: `4px solid ${C.blue}`, overflow: "hidden" }}>
        <div className="border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ padding: "14px 18px" }}>
          <InputGroup style={{ maxWidth: 360 }}>
            <InputGroup.Text>
              <IconSearch size={18} />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Cari nama, username, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Cari user"
            />
          </InputGroup>
          <span className="small text-secondary">
            Menampilkan <b style={{ color: C.navy }}>{rows.length}</b> dari {users.length} user
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left" }}>User</th>
                <th style={{ ...thStyle, textAlign: "left" }}>Role</th>
                {MODULES.map((m) => (
                  <th key={m.key} style={{ ...thStyle, textAlign: "center" }}>
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={MODULES.length + 2} style={{ ...tdStyle, textAlign: "center", padding: "2rem" }}>
                    <Spinner animation="border" size="sm" className="me-2" /> Memuat data...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={MODULES.length + 2} style={{ ...tdStyle, textAlign: "center", padding: "2rem", color: C.mute }}>
                    {users.length === 0 ? "Belum ada data user." : "Tidak ada user yang cocok dengan pencarian."}
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const meta = roleMeta(u.role);
                  return (
                    <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.55 }}>
                      <td style={tdStyle}>
                        <div className="d-flex align-items-center gap-2">
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                            <div style={{ fontSize: ".74rem", color: C.mute }}>@{u.username}</div>
                          </div>
                          {!u.is_active && (
                            <Badge bg="danger" className="rounded-pill" style={{ fontSize: ".65rem" }}>
                              Nonaktif
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: meta?.color ?? "#6c757d",
                            color: "#fff",
                            borderRadius: 999,
                            padding: "2px 10px",
                            fontSize: ".72rem",
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      {MODULES.map((m) => {
                        // Akun nonaktif ditolak backend, jadi tanpa akses sama sekali
                        const level: Level = u.is_active ? m.access[u.role] ?? "none" : "none";
                        return (
                          <td key={m.key} style={{ ...tdStyle, textAlign: "center" }}>
                            {level === "none" ? (
                              <IconX size={18} color="#c4ccd8" aria-label="Tidak diizinkan" />
                            ) : (
                              <span
                                style={{
                                  background: LEVEL_UI[level].bg,
                                  color: LEVEL_UI[level].fg,
                                  borderRadius: 999,
                                  padding: "2px 9px",
                                  fontSize: ".7rem",
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {LEVEL_UI[level].label}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="small" style={{ padding: "12px 18px", color: C.mute, borderTop: `1px solid ${C.line}` }}>
          <b>Lihat</b> = hanya baca. <b>Tambah/Ubah</b> = boleh membuat dan mengubah. <b>Penuh</b> = termasuk menghapus.
        </div>
      </Card>
    </div>
  );
};

export default RoleMatrix;