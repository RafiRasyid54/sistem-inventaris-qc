"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Form, Table, Spinner, Alert, InputGroup } from 'react-bootstrap';
import {
  IconPlus,
  IconSearch,
  IconX,
  IconBriefcase,
  IconMoodEmpty,
  IconCircleCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import Link from 'next/link';
import { getColumns, Pekerjaan } from './ColumnDefination';
import PekerjaanFormModal from './PekerjaanFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';

// Perbaikan Import Path
import apiFetch from "/lib/api";
import { usePermission } from "/hooks/usePermissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Gaya halaman Data Pekerjaan (tema PLN). Semua selector diawali .pln-dk.
const CSS = `
.pln-dk{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--line:#dbe5f1;--mute:#62708a}
.pln-dk .btn-yellow{background:var(--yellow);border:0;color:var(--navy);font-weight:700}
.pln-dk .btn-yellow:hover{background:var(--yellow);color:var(--navy);filter:brightness(1.06)}
.pln-dk .pdk-head h2{font-weight:800;color:var(--navy)}
.pln-dk .pdk-bc a:hover{color:var(--blue)!important}
.pln-dk .pdk-msg{border:0;border-radius:12px;display:flex;align-items:center;gap:10px;font-size:.88rem}

.pln-dk .pdk-card{border-radius:16px;border:1px solid var(--line)!important;border-top:4px solid var(--blue)!important;overflow:hidden;box-shadow:none!important}
.pln-dk .pdk-search{max-width:360px;width:100%}
.pln-dk .pdk-search .form-control:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-dk .pdk-count{font-size:.82rem;color:var(--mute)}
.pln-dk .pdk-count b{color:var(--navy)}

.pln-dk .pdk-table thead th{background:#eef5fc;color:var(--navy);font-size:.8rem;font-weight:700;padding:12px 16px;border:0}
.pln-dk .pdk-table thead th:first-child{border-radius:10px 0 0 10px}
.pln-dk .pdk-table thead th:last-child{border-radius:0 10px 10px 0}
.pln-dk .pdk-table tbody td{padding:14px 16px;border-color:#edf2f8;color:#14233b}
.pln-dk .pdk-table.table-hover>tbody>tr:hover>*{--bs-table-hover-bg:#f6f9fc}

.pln-dk .pdk-empty{text-align:center;padding:44px 0}
.pln-dk .pdk-empty-ic{width:68px;height:68px;border-radius:18px;background:#e6f0fa;color:var(--blue);display:grid;place-items:center;margin:0 auto 14px}
.pln-dk .pdk-empty h5{font-weight:800;color:var(--navy)}
`;

export default function DataPekerjaanManager() {
  const canManage = usePermission("manage_master_data");
  const [data, setData] = useState<Pekerjaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pesan di halaman (pengganti alert() dan console.error saja)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State untuk Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPekerjaan, setSelectedPekerjaan] = useState<Pekerjaan | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // 1. READ: Mengambil data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ success: boolean; data: Pekerjaan[] }>("/pekerjaan");
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setErrorMessage("Gagal memuat data pekerjaan.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedPekerjaan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pekerjaan: Pekerjaan) => {
    setSelectedPekerjaan(pekerjaan);
    setIsFormOpen(true);
  };

  // 2. TOGGLE STATUS: Mengubah status aktif/nonaktif via API
  const handleToggleStatus = async (pekerjaan: Pekerjaan) => {
    try {
      const json = await apiFetch<{ success: boolean }>(`/pekerjaan/${pekerjaan.id}/toggle-status`, {
        method: 'PATCH',
      });
      if (json.success) {
        fetchData(); // Refresh tabel setelah status diubah
      }
    } catch (error) {
      console.error("Gagal mengubah status:", error);
      setErrorMessage("Gagal mengubah status pekerjaan.");
    }
  };

  const handleDeleteClick = (pekerjaan: Pekerjaan) => {
    setSelectedPekerjaan(pekerjaan);
    setIsDeleteOpen(true);
  };

  // 3. DELETE: Menghapus data via API
  const confirmDelete = async () => {
    if (selectedPekerjaan) {
      try {
        const json = await apiFetch<{ success: boolean }>(`/pekerjaan/${selectedPekerjaan.id}`, {
          method: 'DELETE',
        });
        if (json.success) {
          fetchData(); // Refresh tabel setelah dihapus
          flashSuccess(`Pekerjaan "${selectedPekerjaan.nama_pekerjaan}" berhasil dihapus.`);
        }
      } catch (error) {
        console.error("Gagal menghapus data:", error);
        setErrorMessage("Gagal menghapus data pekerjaan.");
      }
    }
    setIsDeleteOpen(false);
    setSelectedPekerjaan(null);
  };

  // 4. CREATE / UPDATE: Menyimpan data via API
  const handleFormSubmit = async (formData: Partial<Pekerjaan>) => {
    const isEdit = !!selectedPekerjaan;
    const url = isEdit ? `${API_URL}/pekerjaan/${selectedPekerjaan.id}` : `${API_URL}/pekerjaan`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const json = await apiFetch<{ success: boolean; message?: string }>(url.replace(API_URL, ""), {
        method: method,
        body: JSON.stringify(formData)
      });
      if (json.success) {
        fetchData(); // Refresh tabel
        setIsFormOpen(false);
        flashSuccess(isEdit ? "Data pekerjaan berhasil diperbarui." : "Pekerjaan baru berhasil ditambahkan.");
      } else {
        setErrorMessage(json.message || "Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      setErrorMessage("Gagal menyimpan data pekerjaan.");
    }
  };

  const columns = useMemo(() => getColumns({
    canManage,
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeleteClick
  }), [data, canManage]);

  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return data;
    return data.filter((item) => (item.nama_pekerjaan || '').toLowerCase().includes(keyword));
  }, [data, searchTerm]);

  return (
    <div className="pln-dk">
      <style>{CSS}</style>

      {successMessage && (
        <Alert variant="success" className="pdk-msg" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} />
          <span>{successMessage}</span>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="danger" className="pdk-msg" dismissible onClose={() => setErrorMessage(null)}>
          <IconAlertTriangle size={20} />
          <span>{errorMessage}</span>
        </Alert>
      )}

      <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4 pdk-head">
        <div>
          <h2 className="mb-1">Data Pekerjaan</h2>
          <p className="text-muted mb-2">Mengelola daftar pekerjaan yang dapat dipilih saat peminjaman alat.</p>
          <div className="d-flex align-items-center text-muted small pdk-bc">
            <Link href="/" className="text-decoration-none text-muted">Home</Link>
            <span className="mx-2">•</span>
            <span className="text-muted">Inventaris</span>
            <span className="mx-2">•</span>
            <span className="text-muted">Data Pekerjaan</span>
          </div>
        </div>
        {canManage && (
          <Button className="btn-yellow d-flex align-items-center gap-2" onClick={handleAdd}>
            <IconPlus size={18} /> Tambah Data
          </Button>
        )}
      </div>

      <Card className="pdk-card">
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <InputGroup className="pdk-search">
              <InputGroup.Text className="bg-white">
                <IconSearch size={18} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Cari nama pekerjaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari nama pekerjaan"
              />
              {searchTerm && (
                <Button variant="outline-secondary" onClick={() => setSearchTerm('')} aria-label="Bersihkan pencarian">
                  <IconX size={16} />
                </Button>
              )}
            </InputGroup>

            {!loading && (
              <div className="pdk-count">
                Menampilkan <b>{filteredData.length}</b>
                {searchTerm ? ` dari ${data.length}` : ''} data
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Memuat data pekerjaan...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="pdk-empty">
              <div className="pdk-empty-ic"><IconBriefcase size={32} /></div>
              <h5 className="mb-1">Belum ada data pekerjaan</h5>
              <p className="text-muted mb-4">Tambahkan pekerjaan agar bisa dipilih saat peminjaman alat.</p>
              {canManage && (
                <Button className="btn-yellow d-inline-flex align-items-center gap-2" onClick={handleAdd}>
                  <IconPlus size={18} /> Tambah Data
                </Button>
              )}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="pdk-empty">
              <div className="pdk-empty-ic"><IconMoodEmpty size={32} /></div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-muted mb-4">Tidak ditemukan pekerjaan yang cocok dengan pencarian.</p>
              <Button variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={() => setSearchTerm('')}>
                <IconX size={18} /> Reset pencarian
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="text-nowrap align-middle mb-0 pdk-table">
                <thead>
                  <tr>
                    <th>Nama pekerjaan</th>
                    <th>Status</th>
                    {canManage && <th>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      {columns.map((col: any) => {
                        const cellContext = {
                          row: { original: item },
                          getValue: () => item[col.accessorKey as keyof Pekerjaan],
                        };
                        return (
                          <td key={col.id || col.header}>
                            {col.cell(cellContext)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <PekerjaanFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedPekerjaan}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        itemName={selectedPekerjaan?.nama_pekerjaan}
      />
    </div>
  );
}