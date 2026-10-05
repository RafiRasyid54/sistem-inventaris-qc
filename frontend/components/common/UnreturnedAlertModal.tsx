'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from 'react-bootstrap';
import { IconAlertTriangle, IconArrowRight, IconX } from '@tabler/icons-react';
import api from '/lib/api'; // Sesuaikan path import jika menggunakan alias (misal: 'lib/api')

// Gaya dialog peringatan bertema PLN: tampil di tengah, latar belakang diredupkan.
const CSS = `
.pln-alert-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pln-alert .modal-content,.pln-alert.modal-content{border:0;border-radius:20px;overflow:hidden;background:#fff;
  box-shadow:0 30px 70px -20px rgba(4,31,56,.7)}
.pln-alert .pa-stripe{height:6px;background:linear-gradient(90deg,#e2231a 0 60%,#ffc20e 60% 80%,#00a7c4 80%)}
.pln-alert .pa-body{position:relative;padding:28px 28px 24px;text-align:center}
.pln-alert .pa-ic{width:64px;height:64px;border-radius:18px;background:#fde7e6;color:#e2231a;display:grid;place-items:center;margin:0 auto 16px}
.pln-alert .pa-title{font-size:1.25rem;font-weight:800;color:#06355f;line-height:1.3;margin:0}
.pln-alert .pa-title b{color:#e2231a}
.pln-alert .pa-text{font-size:.9rem;color:#62708a;margin:8px auto 0;line-height:1.55;max-width:320px}
.pln-alert .pa-x{position:absolute;top:12px;right:12px;border:0;background:transparent;color:#8794a8;width:32px;height:32px;
  border-radius:9px;display:grid;place-items:center;cursor:pointer}
.pln-alert .pa-x:hover{background:#eef3f9;color:#06355f}
.pln-alert .pa-actions{display:flex;gap:10px;margin-top:22px}
.pln-alert .pa-btn{flex:1;border:0;border-radius:12px;padding:11px 14px;font-size:.9rem;font-weight:700;cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;gap:6px}
.pln-alert .pa-ghost{background:#eef3f9;color:#06355f}
.pln-alert .pa-ghost:hover{background:#e0e9f4}
.pln-alert .pa-go{flex:1.4;background:#ffc20e;color:#06355f}
.pln-alert .pa-go:hover{filter:brightness(1.06)}
.pln-alert button:focus-visible{outline:2px solid #0b6bb8;outline-offset:2px}
`;

export default function UnreturnedAlertModal() {
  const [unreturnedCount, setUnreturnedCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndUnreturnedAlatukur = async () => {
      try {
        const userRes: any = await api('/user');

        // Menyesuaikan struktur data user & roles dari backend Laravel/Spatie
        const userData = userRes?.data || userRes;
        const roles = userData?.roles || [];
        const roleNames = Array.isArray(roles) ? roles.map((r: any) => (typeof r === 'string' ? r : r.name)) : [];
        const primaryRole = roleNames[0] || userData?.role || '';

        // Jika bukan role yang diizinkan, hentikan eksekusi agar tidak memicu error 500 pada API selanjutnya
        if (primaryRole && primaryRole.toLowerCase() === 'super admin') {
          // Super admin atau role tertentu bisa dilewati jika diperlukan,
          // sesuaikan logika ini dengan kebutuhan Anda
        }

        const res: any = await api('/peminjaman/belum-kembali');
        const data = res?.data || res;
        const total = Array.isArray(data) ? data.length : (res?.total || 0);

        if (total > 0) {
          setUnreturnedCount(total);
          setShowModal(true);
        }
      } catch (err) {
        // Tangkap error secara diam-diam agar modal tidak membuat aplikasi crash total
        console.error('Gagal mengecek data peminjaman belum kembali:', err);
      }
    };

    checkUserAndUnreturnedAlatukur();
  }, []);

  const close = () => setShowModal(false);

  return (
    <>
      <style>{CSS}</style>
      <Modal
        show={showModal}
        onHide={close}
        centered
        backdropClassName="pln-alert-backdrop"
        contentClassName="pln-alert"
        aria-labelledby="pln-alert-title"
        style={{ zIndex: 999999 }}
      >
        <div className="pa-stripe" />
        <div className="pa-body">
          <button type="button" className="pa-x" onClick={close} aria-label="Tutup">
            <IconX size={18} />
          </button>

          <div className="pa-ic">
            <IconAlertTriangle size={32} />
          </div>
          <h2 className="pa-title" id="pln-alert-title">
            <b>{unreturnedCount} alat</b> belum dikembalikan
          </h2>
          <p className="pa-text">
            Masih ada alat ukur yang dipinjam dan belum kembali. Cek daftarnya dan hubungi peminjam.
          </p>

          <div className="pa-actions">
            <button type="button" className="pa-btn pa-ghost" onClick={close}>
              Nanti
            </button>
            <button
              type="button"
              className="pa-btn pa-go"
              onClick={() => {
                close();
                router.push('/transaksi/peminjaman-aktif');
              }}
            >
              Lihat daftar <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}