"use client";
// import node modules libraries
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormCheck,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { Image } from "react-bootstrap";
import {
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertTriangle,
} from "@tabler/icons-react";

// import custom components
import { getAssetPath } from "helper/assetPath";
import apiFetch from "lib/api";

interface LoginResponse {
  user: {
    id: string;
    full_name: string;
    username: string;
    role: string;
  };
  token: string;
  must_change_password: boolean;
}

// ---- Token desain (semua inline, tidak ada file CSS terpisah) ----
const color = {
  navy950: "#060B14",
  navy900: "#0B1526",
  navy800: "#122036",
  cyan400: "#22D3EE",
  cyan500: "#06B6D4",
  ink900: "#0B1220",
  slate600: "#4B5568",
  slate400: "#8793A6",
  white: "#FFFFFF",
  border100: "#E3E8EF",
  danger600: "#C0392E",
  danger100: "#FBEAE8",
};

const fontDisplay = "'Space Grotesk','Segoe UI',sans-serif";
const fontBody = "'Inter','Segoe UI',sans-serif";
const fontMono = "ui-monospace,'SFMono-Regular',Menlo,monospace";

// nilai pembacaan kalibrasi yang "menyala" sekali saat halaman dibuka —
// murni dekoratif, mengacu ke konteks alat ukur/QC
const READOUT_TARGET = 24.998;

const SignIn = () => {
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [readout, setReadout] = useState(0);
  const [entrance, setEntrance] = useState({ mounted: false, reduced: false });

  // kalau sudah ada sesi login, langsung lempar ke dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/");
      return;
    }
    usernameRef.current?.focus();
  }, [router]);

  // satu momen masuk: kartu + strip pembacaan "menyala" sekali, hormati reduced-motion
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setEntrance({ mounted: true, reduced: true });
      setReadout(READOUT_TARGET);
      return;
    }

    const t = setTimeout(() => setEntrance({ mounted: true, reduced: false }), 20);

    let start: number | null = null;
    let raf = 0;
    const duration = 900;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setReadout(READOUT_TARGET * progress);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: LoginResponse = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.full_name);
      localStorage.setItem("userRole", data.user.role);

      // NOTE: data.must_change_password belum dipakai — kalau alurnya harus
      // mengarahkan ke halaman ganti password, tinggal branching di sini.
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Username atau password salah";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Style inline ----
  const styles: Record<string, CSSProperties> = {
    page: {
      position: "relative",
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      overflow: "hidden",
      background: color.navy950,
      fontFamily: fontBody,
      color: color.ink900,
    },
    bgPhoto: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scale(1.04)",
      filter: "saturate(85%) contrast(105%)",
    },
    bgGrid: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
      backgroundSize: "34px 34px",
      mixBlendMode: "overlay",
    },
    bgOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(60% 55% at 50% 45%, rgba(6,11,20,.35) 0%, rgba(6,11,20,.8) 60%, rgba(6,11,20,.95) 100%)",
    },
    card: {
      position: "relative",
      zIndex: 2,
      width: "min(400px, 92vw)",
      background: "rgba(255,255,255,0.9)",
      border: "1px solid rgba(255,255,255,.5)",
      borderRadius: 22,
      overflow: "hidden",
      backdropFilter: "blur(18px) saturate(150%)",
      WebkitBackdropFilter: "blur(18px) saturate(150%)",
      boxShadow: "0 30px 80px -24px rgba(0,0,0,.65)",
      opacity: entrance.mounted ? 1 : 0,
      transform: entrance.mounted ? "translateY(0) scale(1)" : "translateY(10px) scale(.98)",
      transition: entrance.reduced ? "none" : "opacity .5s ease-out, transform .5s ease-out",
    },
    readoutBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      background: color.navy950,
      color: color.cyan400,
      fontFamily: fontMono,
      fontSize: "clamp(.66rem, 1.6vw, .76rem)",
      letterSpacing: ".4px",
      padding: "10px clamp(16px, 4vw, 22px)",
    },
    readoutDot: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: color.cyan400,
      display: "inline-block",
      opacity: entrance.mounted ? 1 : 0,
      transition: entrance.reduced ? "none" : "opacity .4s ease-out .4s",
    },
    formInner: {
      padding: "clamp(22px, 5vw, 34px) clamp(20px, 6vw, 32px) 28px",
    },
    logo: {
      height: 44,
      width: "auto",
      objectFit: "contain",
    },
    title: {
      fontFamily: fontDisplay,
      fontWeight: 600,
      fontSize: "1.55rem",
      color: color.navy950,
    },
    subtitle: {
      color: color.slate600,
      fontSize: ".87rem",
      lineHeight: 1.5,
    },
    alert: {
      background: color.danger100,
      border: "1px solid rgba(192,57,46,.25)",
      color: color.danger600,
      borderRadius: 8,
    },
    inputIcon: {
      background: "#F3F6FA",
      border: `1px solid ${color.border100}`,
      borderRight: "none",
      color: color.slate400,
    },
    input: {
      border: `1px solid ${color.border100}`,
      borderLeft: "none",
      paddingBlock: 10,
      fontSize: ".95rem",
    },
    passwordToggle: {
      border: `1px solid ${color.border100}`,
      borderLeft: "none",
      color: color.slate400,
      paddingInline: 10,
    },
    helpText: {
      fontSize: ".78rem",
      color: color.slate400,
    },
    submitBtn: {
      background: color.navy900,
      borderColor: color.navy900,
      fontWeight: 600,
      paddingBlock: 11,
      borderRadius: 8,
    },
    footer: {
      marginTop: 26,
      fontSize: ".72rem",
      color: color.slate400,
      lineHeight: 1.5,
    },
  };

  return (
    <div style={styles.page}>
      <Image
        src={getAssetPath("/images/png/qc-inspection.png")}
        alt=""
        aria-hidden="true"
        style={styles.bgPhoto}
      />
      <div style={styles.bgGrid} aria-hidden="true" />
      <div style={styles.bgOverlay} aria-hidden="true" />

      <div style={styles.card}>
        <div style={styles.readoutBar} aria-hidden="true">
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            ⌀ {readout.toFixed(3)} mm
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={styles.readoutDot} />
            SISTEM AKTIF
          </span>
        </div>

        <div style={styles.formInner}>
          <div className="text-center mb-4">
            <Image
              src={getAssetPath("/images/png/PLN_Logo_QC.png")}
              alt="PT PLN (PERSERO) PUSHARLIS UP2WIII"
              style={styles.logo}
            />
          </div>

          <div className="mb-4">
            <h1 className="mb-2" style={styles.title}>Masuk</h1>
            <p className="mb-0" style={styles.subtitle}>
              Sistem Inventaris dan Riwayat Kalibrasi Alat Ukur — Divisi Quality Control.
            </p>
          </div>

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError(null)}
              className="d-flex align-items-start gap-2 py-2 small"
              style={styles.alert}
            >
              <IconAlertTriangle size={18} className="flex-shrink-0 mt-1" />
              <span>{error}</span>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="mb-3">
              <Form.Label htmlFor="signinUsernameInput">Username</Form.Label>
              <InputGroup>
                <InputGroup.Text style={styles.inputIcon}>
                  <IconUser size={18} />
                </InputGroup.Text>
                <FormControl
                  ref={usernameRef}
                  type="text"
                  id="signinUsernameInput"
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={styles.input}
                />
              </InputGroup>
            </div>

            <div className="mb-3">
              <Form.Label htmlFor="signinPasswordInput">Password</Form.Label>
              <InputGroup>
                <InputGroup.Text style={styles.inputIcon}>
                  <IconLock size={18} />
                </InputGroup.Text>
                <FormControl
                  type={showPassword ? "text" : "password"}
                  id="signinPasswordInput"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={styles.input}
                />
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  style={styles.passwordToggle}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </Button>
              </InputGroup>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <FormCheck
                label="Ingat saya"
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span style={styles.helpText}>Lupa kata sandi? Hubungi admin.</span>
            </div>

            <div className="d-grid">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                style={styles.submitBtn}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Memverifikasi...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </div>
          </Form>

          <div className="text-center" style={styles.footer}>
            © 2026 PT PLN (PERSERO) PUSHARLIS UP2WIII
            <br />
            DIVISI QUALITY CONTROL
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;