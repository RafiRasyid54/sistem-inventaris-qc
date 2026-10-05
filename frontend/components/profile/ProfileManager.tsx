"use client";

// import node module libraries
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconLock,
  IconCamera,
  IconLogout,
  IconCircleCheck,
  IconAlertTriangle,
  IconEye,
  IconEyeOff,
  IconUser,
} from "@tabler/icons-react";

// import custom components
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { Avatar } from "components/common/Avatar";

// import services
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  ProfileApiData,
} from "services/profileService";

interface ProfileData {
  namaLengkap: string;
  role: string;
  divisi: string;
  avatarPath?: string | null; // Tambahkan " | null" di sini
}

const emptyProfile: ProfileData = {
  namaLengkap: "",
  role: "",
  divisi: "-",
};

// Gaya halaman Profil (tema PLN). Semua selector diawali .pln-pp.
const CSS = `
.pln-pp{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--line:#dbe5f1;--mute:#62708a}
.pln-pp .pp-head h1{font-weight:800;color:var(--navy)}
.pln-pp .pp-head p{max-width:640px}

/* pesan */
.pln-pp .pp-msg{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.88rem}

/* kartu */
.pln-pp .pp-card{border:1px solid var(--line)!important;border-radius:16px;overflow:hidden;box-shadow:none!important}
.pln-pp .pp-card.is-top{border-top:4px solid var(--blue)!important}

/* kartu identitas */
.pln-pp .pp-hero{position:relative;height:96px;background:linear-gradient(115deg,#06355f 0%,#0b6bb8 70%,#00a7c4 140%)}
.pln-pp .pp-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;
  background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pln-pp .pp-avatar{width:fit-content;margin:-56px auto 12px;border:4px solid #fff;border-radius:50%;background:#fff;position:relative}
.pln-pp .pp-name{font-weight:800;color:var(--navy)}
.pln-pp .pp-role{display:inline-block;font-size:.76rem;font-weight:700;padding:4px 14px;border-radius:99px;
  background:var(--yellow);color:var(--navy)}
.pln-pp .pp-div{font-size:.82rem;color:var(--mute);margin-top:8px}

/* judul seksi */
.pln-pp .pp-title{display:flex;align-items:center;gap:12px;margin:0}
.pln-pp .pp-title .ic{width:40px;height:40px;border-radius:11px;background:#e6f0fa;color:var(--blue);display:grid;place-items:center;flex:none}
.pln-pp .pp-title b{font-size:1.05rem;font-weight:800;color:var(--navy)}

/* form */
.pln-pp .form-label{font-size:.8rem;font-weight:600;color:#14233b;margin-bottom:4px}
.pln-pp .form-control{background-color:#f6f9fc;border-color:var(--line);border-radius:10px}
.pln-pp .form-control:focus{background-color:#fff;border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-pp .form-control:disabled,.pln-pp .form-control[readonly]{background-color:#eef3f9;color:#14233b;opacity:1}
.pln-pp .pp-eye{color:var(--mute);line-height:1}
.pln-pp .pp-eye:hover{color:var(--navy)}
.pln-pp .pp-foot{border-top:1px solid var(--line)}

/* tombol */
.pln-pp .pp-btn{border:0;border-radius:11px;padding:9px 18px;font-weight:700;font-size:.9rem;display:inline-flex;align-items:center;gap:6px}
.pln-pp .pp-ghost{background:#eef3f9;color:var(--navy)}
.pln-pp .pp-ghost:hover,.pln-pp .pp-ghost:focus{background:#e0e9f4;color:var(--navy)}
.pln-pp .pp-save{background:var(--yellow);color:var(--navy)}
.pln-pp .pp-save:hover,.pln-pp .pp-save:focus{background:var(--yellow);color:var(--navy);filter:brightness(1.06)}
.pln-pp .pp-save:disabled{background:var(--yellow);color:var(--navy);opacity:.5}
.pln-pp .pp-photo{border:1.5px solid var(--blue);color:var(--blue);background:#fff;border-radius:99px;
  padding:6px 16px;font-weight:700;font-size:.82rem;display:inline-flex;align-items:center;gap:6px}
.pln-pp .pp-photo:hover,.pln-pp .pp-photo:focus{background:#e6f0fa;color:var(--navy);border-color:var(--blue)}
.pln-pp .pp-logout{border:1.5px solid #e2231a;color:#e2231a;background:#fff;border-radius:11px;
  padding:9px 22px;font-weight:700;font-size:.9rem;display:inline-flex;align-items:center;gap:8px}
.pln-pp .pp-logout:hover,.pln-pp .pp-logout:focus{background:#fde1df;color:#a8160f;border-color:#e2231a}
.pln-pp button:focus-visible{outline:2px solid var(--yellow);outline-offset:2px}
`;

const ProfileManager = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile States
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [avatarSrc, setAvatarSrc] = useState<string>("/images/avatar/avatar-1.jpg");

  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Message States
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password States
  const [passwordForm, setPasswordForm] = useState({
    lama: "",
    baru: "",
    konfirmasi: "",
  });
  const [showPassword, setShowPassword] = useState({
    lama: false,
    baru: false,
    konfirmasi: false,
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Mencegah Hydration Mismatch dengan memanggil localStorage di dalam useEffect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("userAvatarUrl");
      if (cached) setAvatarSrc(cached);
    }
    loadProfile();
  }, []);

  const toggleShowPassword = (field: "lama" | "baru" | "konfirmasi") => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const loadProfile = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data: ProfileApiData = await getProfile();
      const mapped: ProfileData = {
        namaLengkap: data.namaLengkap,
        role: data.role,
        divisi: data.divisi || "-",
        avatarPath: data.avatarPath ?? undefined, // null akan otomatis diubah menjadi undefined
      };
      setProfile(mapped);
      setForm(mapped);

      if (data.avatarPath) {
        const backendOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");
        const url = `${backendOrigin}/storage/${data.avatarPath}`;
        setAvatarSrc(url);
        localStorage.setItem("userAvatarUrl", url);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data profil";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setForm(profile);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm(profile);
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateProfile({
        namaLengkap: form.namaLengkap,
        divisi: form.divisi,
      });
      const mapped: ProfileData = {
        namaLengkap: updated.namaLengkap,
        role: updated.role,
        divisi: updated.divisi || "-",
        avatarPath: profile.avatarPath, // Mempertahankan data avatar saat form disimpan
      };
      setProfile(mapped);
      setForm(mapped);
      setIsEditing(false);
      showSuccess("Profil berhasil diperbarui.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan profil";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.lama || !passwordForm.baru || !passwordForm.konfirmasi) {
      setPasswordError("Semua field password wajib diisi.");
      return;
    }
    if (passwordForm.baru !== passwordForm.konfirmasi) {
      setPasswordError("Konfirmasi password tidak cocok dengan password baru.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        passwordLama: passwordForm.lama,
        passwordBaru: passwordForm.baru,
        konfirmasiPasswordBaru: passwordForm.konfirmasi,
      });
      setPasswordForm({ lama: "", baru: "", konfirmasi: "" });
      showSuccess("Password berhasil diperbarui.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memperbarui password";
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview instan sambil upload jalan di background
    const previewUrl = URL.createObjectURL(file);
    setAvatarSrc(previewUrl);

    setAvatarUploading(true);
    try {
      const result = await uploadAvatar(file);
      setAvatarSrc(result.avatar_url);
      localStorage.setItem("userAvatarUrl", result.avatar_url);
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: result.avatar_url }));
      showSuccess("Foto profil berhasil diperbarui.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal mengunggah foto profil");
      // Menggunakan properti profile.avatarPath yang sekarang valid di TypeScript
      setAvatarSrc(profile.avatarPath ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "")}/storage/${profile.avatarPath}` : "/images/avatar/avatar-1.jpg");
    } finally {
      setAvatarUploading(false);
      // Reset input agar bisa memilih file yang sama lagi jika sebelumnya gagal
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userAvatarUrl");
    }
    router.push("/signin");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-6 h-100">
        <Spinner animation="border" size="sm" className="me-2 text-primary" />
        <span className="text-secondary">Memuat profil...</span>
      </div>
    );
  }

  // Satu field password dengan tombol tampilkan/sembunyikan
  const passwordField = (
    field: "lama" | "baru" | "konfirmasi",
    label: string
  ) => (
    <Col md={4}>
      <Form.Group>
        <Form.Label>{label}</Form.Label>
        <div className="position-relative">
          <Form.Control
            type={showPassword[field] ? "text" : "password"}
            value={passwordForm[field]}
            disabled={passwordSaving}
            onChange={(e) =>
              setPasswordForm((p) => ({ ...p, [field]: e.target.value }))
            }
            style={{ paddingRight: "2.5rem" }}
          />
          <Button
            variant="link"
            className="pp-eye position-absolute top-50 end-0 translate-middle-y p-0 me-3"
            onClick={() => toggleShowPassword(field)}
            tabIndex={-1}
            type="button"
            aria-label={showPassword[field] ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword[field] ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </Button>
        </div>
      </Form.Group>
    </Col>
  );

  return (
    <div className="profile-page pln-pp">
      <style>{CSS}</style>

      {successMessage && (
        <Alert
          variant="success"
          className="pp-msg"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          <IconCircleCheck size={20} />
          <span>{successMessage}</span>
        </Alert>
      )}
      {loadError && (
        <Alert
          variant="danger"
          className="pp-msg"
          dismissible
          onClose={() => setLoadError(null)}
        >
          <IconAlertTriangle size={20} />
          <span>{loadError}</span>
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <div className="mb-4 pp-head">
            <h1 className="mb-2 h2">Profil Saya</h1>
            <p className="text-secondary mb-2">
              Kelola informasi akun dan keamanan Anda.
            </p>
            <DasherBreadcrumb />
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* ---- Kartu Identitas ---- */}
        <Col xl={4} lg={5}>
          <Card className="card-lg h-100 pp-card">
            <div className="pp-hero" />
            <CardBody className="text-center pt-0">
              <div className="pp-avatar">
                <Avatar
                  type="image"
                  src={avatarSrc}
                  size="xl"
                  alt="Foto Profil"
                  className="rounded-circle"
                />
              </div>
              <h4 className="pp-name mb-2">{profile.namaLengkap}</h4>
              <div>
                <span className="pp-role">{profile.role}</span>
              </div>
              {profile.divisi && profile.divisi !== "-" && (
                <div className="pp-div">Divisi: {profile.divisi}</div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleAvatarChange}
              />
              <Button
                className="pp-photo mt-3"
                onClick={handleAvatarClick}
                disabled={avatarUploading}
              >
                {avatarUploading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <IconCamera size={18} />
                )}
                {avatarUploading ? "Mengunggah..." : "Ganti Foto"}
              </Button>
            </CardBody>
          </Card>
        </Col>

        {/* ---- Informasi Profil ---- */}
        <Col xl={8} lg={7}>
          <Card className="card-lg h-100 pp-card is-top">
            <CardBody>
              <Flex justifyContent="between" alignItems="center" className="mb-4">
                <h5 className="pp-title">
                  <span className="ic"><IconUser size={22} /></span>
                  <b>Informasi Profil</b>
                </h5>
                {!isEditing && (
                  <Button className="pp-btn pp-ghost" size="sm" onClick={handleEdit}>
                    <IconEdit size={18} />
                    Edit Profil
                  </Button>
                )}
              </Flex>

              {saveError && (
                <Alert
                  variant="danger"
                  className="pp-msg"
                  dismissible
                  onClose={() => setSaveError(null)}
                >
                  <IconAlertTriangle size={20} />
                  <span>{saveError}</span>
                </Alert>
              )}

              <Form onSubmit={handleSave}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Nama Lengkap</Form.Label>
                      <Form.Control
                        value={form.namaLengkap}
                        disabled={!isEditing || saving}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, namaLengkap: e.target.value }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Role</Form.Label>
                      <Form.Control value={form.role} disabled readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Divisi</Form.Label>
                      <Form.Control
                        value={form.divisi}
                        disabled={!isEditing || saving}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, divisi: e.target.value }))
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {isEditing && (
                  <div className="pp-foot d-flex gap-2 mt-4 pt-3">
                    <Button type="submit" disabled={saving} className="pp-btn pp-save">
                      {saving ? <Spinner animation="border" size="sm" /> : <IconDeviceFloppy size={18} />}
                      Simpan
                    </Button>
                    <Button
                      type="button"
                      disabled={saving}
                      className="pp-btn pp-ghost"
                      onClick={handleCancel}
                    >
                      <IconX size={18} />
                      Batal
                    </Button>
                  </div>
                )}
              </Form>
            </CardBody>
          </Card>
        </Col>

        {/* ---- Ubah Password ---- */}
        <Col xs={12}>
          <Card className="card-lg pp-card is-top">
            <CardBody>
              <h5 className="pp-title mb-4">
                <span className="ic"><IconLock size={22} /></span>
                <b>Ubah Password</b>
              </h5>

              {passwordError && (
                <Alert
                  variant="danger"
                  className="pp-msg"
                  onClose={() => setPasswordError(null)}
                  dismissible
                >
                  <IconAlertTriangle size={20} />
                  <span>{passwordError}</span>
                </Alert>
              )}

              <Form onSubmit={handlePasswordSubmit}>
                <Row className="g-3">
                  {passwordField("lama", "Password Lama")}
                  {passwordField("baru", "Password Baru")}
                  {passwordField("konfirmasi", "Konfirmasi Password")}
                </Row>
                <Button type="submit" disabled={passwordSaving} className="pp-btn pp-save mt-4">
                  {passwordSaving ? <Spinner animation="border" size="sm" /> : <IconLock size={18} />}
                  Simpan Password
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        {/* ---- Logout ---- */}
        <Col xs={12}>
          <div className="text-center py-3">
            <Button className="pp-logout" onClick={handleLogout}>
              <IconLogout size={18} />
              Keluar Akun (Logout)
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ProfileManager;