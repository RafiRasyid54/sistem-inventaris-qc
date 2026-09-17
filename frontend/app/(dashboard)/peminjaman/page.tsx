'use client'

import { useState, useEffect } from 'react'
import apiFetch from '/lib/apiFetch'

interface AntreanItem {
  id?: string;
  alat_ukur_id: string;
  nama_alat_ukur?: string;
  qty: number;
}

interface Peminta {
  id: string;
  nama: string;
}

export default function PeminjamanPage() {
  const [items, setItems] = useState<AntreanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State form input
  const [pemintaId, setPemintaId] = useState('')
  const [stasiunKerja, setStasiunKerja] = useState('')
  
  // State daftar peminjam (teknisi)
  const [listPeminta, setListPeminta] = useState<Peminta[]>([
    { id: '1111-uuid-dummy-1', nama: 'Teknisi Alpha' },
    { id: '2222-uuid-dummy-2', nama: 'Teknisi Beta' }
  ])

  // 1. Fetch daftar peminjam dari backend
  const fetchListPeminta = async () => {
    try {
      const data = await apiFetch<Peminta[]>('/users?role=teknisi')
      if (Array.isArray(data) && data.length > 0) {
        setListPeminta(data)
      }
    } catch (error) {
      console.warn('Menggunakan daftar peminjam lokal/fallback.')
    }
  }

  // 2. Fetch antrean hasil scan
  const fetchAntreanScan = async (isInitial = false) => {
    if (isInitial) setLoading(true)
    try {
      const result = await apiFetch<{ data: AntreanItem[] }>('/peminjaman/antrean')
      setItems(result.data || [])
    } catch (error) {
      console.error('Gagal mengambil antrean scan:', error)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchListPeminta()
    fetchAntreanScan(true)
    
    // Polling background tiap 3 detik tanpa mentrigger indikator loading
    const interval = setInterval(() => {
      fetchAntreanScan(false)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async () => {
    if (!pemintaId) {
      alert('Harap pilih Nama Peminjam terlebih dahulu!')
      return
    }
    if (items.length === 0) {
      alert('Antrean masih kosong. Scan alat terlebih dahulu!')
      return
    }

    setIsSubmitting(true)

    // Mengambil user ID session login jika tersimpan di localStorage
    const loggedInUser = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null

    try {
      await apiFetch('/peminjaman/proses', {
        method: 'POST',
        body: JSON.stringify({
          peminta_id: pemintaId, 
          area_pekerjaan: stasiunKerja,
          dicatat_oleh: loggedInUser || 'system_admin'
        })
      })

      alert('Peminjaman berhasil diproses!')
      setItems([])
      setPemintaId('')
      setStasiunKerja('')
    } catch (error: any) {
      console.error('Error submit:', error)
      alert(`Gagal: ${error.message || 'Terjadi kesalahan saat menyimpan peminjaman.'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Proses Peminjaman Alat</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BAGIAN KIRI: Form Peminjam */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Data Peminjam</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nama Peminjam <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm outline-none"
              value={pemintaId}
              onChange={(e) => setPemintaId(e.target.value)}
            >
              <option value="" disabled>-- Pilih Teknisi --</option>
              {listPeminta.map((peminta) => (
                <option key={peminta.id} value={peminta.id}>{peminta.nama}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-1">Stasiun Kerja / Area Pekerjaan</label>
            <input 
              type="text" 
              placeholder="Contoh: Boiler Area 1"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
              value={stasiunKerja}
              onChange={(e) => setStasiunKerja(e.target.value)}
            />
          </div>
        </div>

        {/* BAGIAN KANAN: Daftar Antrean & Tombol Submit */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold text-slate-800">Daftar Alat (Hasil Scan)</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
              {items.length} Item
            </span>
          </div>

          {loading ? (
            <p className="text-slate-500 text-center py-6 text-sm">Memuat data antrean...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
              <p className="text-slate-500 text-sm">Belum ada alat yang discan.</p>
              <p className="text-xs text-slate-400 mt-1">Arahkan perangkat ke QR Code alat untuk memasukkan ke antrean.</p>
            </div>
          ) : (
            <ul className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2">
              {items.map((item, index) => (
                <li key={item.id || index} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800 block text-sm">
                      {item.alat_ukur_id}
                    </span>
                    {item.nama_alat_ukur && (
                      <span className="text-xs text-slate-500">{item.nama_alat_ukur}</span>
                    )}
                  </div>
                  <div className="bg-white border border-slate-200 px-3 py-1 rounded-md font-bold text-xs text-blue-600">
                    Qty: {item.qty}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Tombol Submit */}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0}
            className={`w-full py-3.5 rounded-lg font-bold text-sm text-white transition-all shadow-md 
              ${isSubmitting || items.length === 0 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`
            }
          >
            {isSubmitting ? 'Menyimpan...' : 'Proses & Simpan Peminjaman'}
          </button>
        </div>

      </div>
    </div>
  )
}