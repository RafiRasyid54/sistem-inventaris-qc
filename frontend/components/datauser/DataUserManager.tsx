"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Spinner,
  Alert,
  InputGroup,
  Form,
} from "react-bootstrap";
import {
  IconPlus,
  IconCircleCheck,
  IconSearch,
  IconX,
  IconUsers,
  IconMoodEmpty,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { UserItemType, UserFormValues } from "types/DataUserTypes";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  resetUserPassword,
} from "services/userService";
import api from "lib/api";

import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getDataUserColumns } from "components/datauser/ColumnDefination";
import UserFormModal from "components/datauser/UserFormModal";
import DeleteConfirmModal from "components/datauser/DeleteConfirmModal";
import ActivateConfirmModal from "components/datauser/ActivateConfirmModal";
import ResetPasswordModal from "components/datauser/ResetPasswordModal";

// Gaya halaman Manajemen User (tema PLN). Semua selector diawali .pln-du.
const CSS = `
.pln-du{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--line:#dbe5f1;--mute:#62708a}
.pln-du .btn-yellow{background:var(--yellow);border:0;color:var(--navy);font-weight:700}
.pln-du .btn-yellow:hover,.pln-du .btn-yellow:focus{background:var(--yellow);color:var(--navy);filter:brightness(1.06)}
.pln-du .du-head h1{font-weight:800;color:var(--navy)}
.pln-du .du-head p{max-width:640px}

/* pesan */
.pln-du .du-msg{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.88rem}

/* kartu tabel */
.pln-du .du-card{border-radius:16px;border:1px solid var(--line);border-top:4px solid var(--blue);overflow:hidden}
.pln-du .du-card .datatools-toolbar{padding:14px 18px;background:#fff}
.pln-du .du-card .form-control:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-du .du-info b{color:var(--navy)}

/* switch tampilkan yang dihapus */
.pln-du .du-switch .form-check-input:checked{background-color:var(--blue);border-color:var(--blue)}
.pln-du .du-switch .form-check-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}

/* tabel */
.pln-du .du-card table thead th{background:#eef3f9;color:var(--navy);font-size:.74rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.02em;border-bottom:1px solid var(--line);white-space:nowrap;padding:.75rem .9rem}
.pln-du .du-card table tbody td{padding:.8rem .9rem;font-size:.85rem;color:#14233b;vertical-align:middle}
.pln-du .du-card table tbody tr:hover>*{background:#f6f9fc}
.pln-du .du-card .page-item.active .page-link{background:var(--blue);border-color:var(--blue);color:#fff}
.pln-du .du-card .page-link{color:var(--navy)}

/* empty state */
.pln-du .du-empty-icon{width:72px;height:72px;border-radius:50%;margin:0 auto;display:grid;place-items:center;
  background:#e6f0fa;color:var(--blue)}
.pln-du .du-empty.is-search .du-empty-icon{background:#fff8e1;color:#9a6a00}
.pln-du .du-empty h5{font-weight:800;color:var(--navy)}
`;

const DataUserManager = () => {
  const [users, setUsers] = useState<UserItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RBAC dimatikan: semua pengguna dianggap boleh mengelola user.
  const isAdmin = true;
  const isSuperAdmin = true;
  const [roleColorMap, setRoleColorMap] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserItemType | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadRoleColors = () => {
    api("/roles")
      .then((res: any) => {
        const data = res?.data || res || [];
        const list = Array.isArray(data) ? data : [];
        const map: Record<string, string> = {};
        list.forEach((r: any) => { map[r.name] = r.color ?? "secondary"; });
        setRoleColorMap(map);
      })
      .catch(() => setRoleColorMap({}));
  };

  useEffect(() => {
    loadRoleColors();
    const handleRolesUpdated = () => {
      loadRoleColors();
      loadUsers();
    };
    window.addEventListener("roles-updated", handleRolesUpdated);
    return () => window.removeEventListener("roles-updated", handleRolesUpdated);
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return users
      .filter((u) => isSuperAdmin || u.role !== "Super Admin") // Hanya Super Admin yang bisa melihat user Super Admin
      .filter((u) => showDeleted || u.is_active) // Sembunyikan yang sudah "dihapus" kecuali toggle dinyalakan
      .filter(
        (u) =>
          keyword === "" ||
          u.full_name.toLowerCase().includes(keyword) ||
          u.username.toLowerCase().includes(keyword) ||
          (u.email ?? "").toLowerCase().includes(keyword)
      )
      .sort((a, b) => {
        // Yang aktif selalu di atas, nonaktif selalu di bawah
        if (a.is_active !== b.is_active) {
          return a.is_active ? -1 : 1;
        }
        // Di dalam grup yang sama, urutkan abjad nama
        return a.full_name.localeCompare(b.full_name);
      });
  }, [users, searchTerm, showDeleted]);

  const openAddModal = () => {
    setActiveUser(null);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (user: UserItemType) => {
    setActiveUser(user);
    setFormError(null);
    setFormModalOpen(true);
  };

  const openDeactivateModal = (user: UserItemType) => {
    setActiveUser(user);
    setDeactivateModalOpen(true);
  };

  const openActivateModal = (user: UserItemType) => {
    setActiveUser(user);
    setActivateModalOpen(true);
  };

  const openResetModal = (user: UserItemType) => {
    setActiveUser(user);
    setResetError(null);
    setResetModalOpen(true);
  };

  const handleFormSubmit = async (values: UserFormValues) => {
    setFormError(null);
    try {
      if (activeUser) {
        const updated = await updateUser(activeUser.id, values, isAdmin);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showSuccess("User berhasil diperbarui.");
      } else {
        const created = await createUser(values, isAdmin);
        setUsers((prev) => [...prev, created]);
        showSuccess("User baru berhasil ditambahkan.");
      }
      setFormModalOpen(false);
      setActiveUser(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan data user");
    }
  };

  // Error aksi hapus/aktifkan ditampilkan sebagai alert di halaman (pengganti alert() bawaan browser)
  const handleConfirmDeactivate = async () => {
    if (!activeUser) return;
    try {
      await deleteUser(activeUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== activeUser.id));
      showSuccess("User berhasil dihapus.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus user");
    } finally {
      setDeactivateModalOpen(false);
      setActiveUser(null);
    }
  };

  const handleConfirmActivate = async () => {
    if (!activeUser) return;
    try {
      await activateUser(activeUser.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === activeUser.id ? { ...u, is_active: true } : u))
      );
      showSuccess(`${activeUser.full_name} berhasil diaktifkan kembali.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengaktifkan user");
    } finally {
      setActivateModalOpen(false);
      setActiveUser(null);
    }
  };

  const handleResetSubmit = async (passwordBaru: string, konfirmasi: string) => {
    if (!activeUser) return;
    setResetError(null);
    setResetSubmitting(true);
    try {
      await resetUserPassword(activeUser.id, {
        password_baru: passwordBaru,
        password_baru_confirmation: konfirmasi,
      });
      showSuccess(`Password untuk ${activeUser.full_name} berhasil direset.`);
      setResetModalOpen(false);
      setActiveUser(null);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Gagal mereset password");
    } finally {
      setResetSubmitting(false);
    }
  };

  const columns = useMemo(
    () =>
      getDataUserColumns({
        isAdmin,
        roleColorMap,
        onEdit: openEditModal,
        onDeactivate: openDeactivateModal,
        onActivate: openActivateModal,
        onResetPassword: openResetModal,
      }),
    [roleColorMap]
  );

  return (
    <div className="datatools-page pln-du">
      <style>{CSS}</style>

      {successMessage && (
        <Alert
          variant="success"
          className="du-msg"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          <span>{successMessage}</span>
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          className="du-msg"
          dismissible
          onClose={() => setError(null)}
        >
          <IconAlertTriangle size={20} />
          <span>{error}</span>
        </Alert>
      )}

      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100 du-head" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Manajemen User</h1>
              <p className="text-secondary mb-2">
                Mengelola seluruh akun pengguna sistem.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button className="btn-yellow d-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} />
                Tambah User
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6 du-card">
        <div className="datatools-toolbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={6} md={7}>
              <InputGroup className="datatools-search">
                <InputGroup.Text>
                  <IconSearch size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Cari user"
                />
                {searchTerm && (
                  <Button
                    variant="link"
                    className="datatools-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Bersihkan pencarian"
                  >
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={6} md={5} className="text-md-end d-flex justify-content-end align-items-center gap-3">
              <Form.Check
                type="switch"
                id="show-deleted-switch"
                label="Tampilkan yang dihapus"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="du-switch small text-secondary mb-0"
              />
              <span className="du-info text-secondary small">
                Menampilkan <b>{filteredUsers.length}</b> dari {users.length} data
              </span>
            </Col>
          </Row>
        </div>

        <CardBody>
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat data...
            </div>
          ) : users.length === 0 ? (
            <div className="du-empty text-center py-6">
              <div className="du-empty-icon mb-3">
                <IconUsers size={32} />
              </div>
              <h5 className="mb-1">Belum ada data user</h5>
              <p className="text-secondary mb-4">Mulai dengan menambahkan user pertama.</p>
              <Button className="btn-yellow d-inline-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} /> Tambah User
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="du-empty is-search text-center py-6">
              <div className="du-empty-icon mb-3">
                <IconMoodEmpty size={32} />
              </div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">Tidak ditemukan user yang cocok dengan pencarian.</p>
              <Button variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={() => setSearchTerm("")}>
                <IconX size={18} /> Reset Pencarian
              </Button>
            </div>
          ) : (
            <TanstackTable data={filteredUsers} columns={columns} pagination />
          )}
        </CardBody>
      </Card>

      <UserFormModal
        show={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setActiveUser(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={activeUser}
        isAdmin={isAdmin}
        error={formError}
      />

      <DeleteConfirmModal
        show={deactivateModalOpen}
        onClose={() => {
          setDeactivateModalOpen(false);
          setActiveUser(null);
        }}
        onConfirm={handleConfirmDeactivate}
        user={activeUser}
      />

      <ActivateConfirmModal
        show={activateModalOpen}
        onClose={() => {
          setActivateModalOpen(false);
          setActiveUser(null);
        }}
        onConfirm={handleConfirmActivate}
        user={activeUser}
      />

      <ResetPasswordModal
        show={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setActiveUser(null);
          setResetError(null);
        }}
        onSubmit={handleResetSubmit}
        user={activeUser}
        error={resetError}
        submitting={resetSubmitting}
      />
    </div>
  );
};

export default DataUserManager;