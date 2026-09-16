"use client";
// import node module libraries
import { exportToExcel, exportToPDF, ExportColumn } from "components/ruangalat ukur/riwayat/common/exportUtils";
import { AntreanItemResponse } from "services/peminjamanService";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  IconAlatukur,
  IconMoodEmpty,
} from "@tabler/icons-react";
import { v4 as uuid } from "uuid";
import useSWR, { useSWRConfig } from "swr";

// Import service layer
import {
  fetchAntrean,
  scanAlatukur,
  updateCartItem,
  removeCartItem,
  prosesPeminjamanApi,
} from "services/peminjamanService";
import { getConsumables } from "services/consumableService"; // Tambahan untuk Universal Scanner

import api from "lib/api";

// import redux store
import { useAppDispatch, useAppSelector } from "store/store";
import {
  fetchAlatukur,
  addAlatukurThunk,
  updateAlatukurThunk,
  deleteAlatukurThunk,
} from "store/slices/inventoryAlatukurSlice";

// import custom types
import {
  AlatukurItemType,
  AlatukurFormValues,
  CartItemType,
} from "types/DataAlatukurTypes";
import { ConsumableItemType } from "types/DataConsumableTypes"; // Tambahan untuk Universal Scanner

// import custom components
import TanstackTable from "components/table/TanstackTable";
import Flex from "components/common/Flex";
import DasherBreadcrumb from "components/common/DasherBreadcrumb";
import { getDataAlatukurColumns } from "components/ruangalat ukur/dataalat ukur/ColumnDefination";
import AlatukurFormModal from "components/ruangalat ukur/dataalat ukur/AlatukurFormModal";
import AlatukurDetailModal from "components/ruangalat ukur/dataalat ukur/AlatukurDetailModal";
import DeleteConfirmModal from "components/ruangalat ukur/dataalat ukur/DeleteConfirmModal";
import CartFAB from "components/ruangalat ukur/dataalat ukur/CartFAB";
import CartOffcanvas from "components/common/CartOffcanvas";
import LoanFormModal from "components/common/LoanFormModal";
import AddToCartFlyEffect, {
  FlyAnimationItem,
} from "components/ruangalat ukur/dataalat ukur/AddToCartFlyEffect";

// Tipe gabungan untuk item keranjang (alat ukur + consumable)
interface UnifiedCartItem extends Partial<CartItemType> {
  cartId?: string | number;
  id?: string | number;
  consumable_id?: string;
  jumlah: number;
  item_type?: "alat ukur" | "consumable";
}

interface LoanSubmitValues {
  peminjamId?: string;
  pemintaId?: string;
  namaPeminjam?: string;
  namaPeminta?: string;
  namaPekerjaan: string;
  areaKerja: string;
  spesifikasi?: string;
  keterangan?: string;
}

// ---- Helper: generate kode barang berikutnya ----
const generateNextKodeBarang = (alat ukur: AlatukurItemType[]): string => {
  if (alat ukur.length === 0) return "T-001";
  const maxNumber = alat ukur.reduce((max, alat ukur) => {
    const match = alat ukur.kodeBarang.match(/^T-(\d+)$/);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  const nextNumber = maxNumber + 1;
  return `T-${String(nextNumber).padStart(3, "0")}`;
};

const EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Kode Barang", key: "kodeBarang" },
  { header: "Nama Barang", key: "namaBarang" },
  { header: "Merk", key: "merk" },
  { header: "Tipe", key: "tipe" },
  { header: "Warna", key: "warna" },
  { header: "Ukuran", key: "ukuran" },
  { header: "Kondisi", key: "kondisi" },
  { header: "Stok", key: "stok" },
  { header: "Dipinjam", key: "dipinjam" },
  { header: "Tersedia", key: "tersedia" },
];

const DataAlatukurManager = () => {
  const dispatch = useAppDispatch();
  const { mutate } = useSWRConfig();

  // Data alat ukur dari Redux store
  const alat ukur = useAppSelector((state) => state.inventoryAlatukur.alat ukur);
  const loadingAlatukur = useAppSelector((state) => state.inventoryAlatukur.loadingAlatukur);
  const alat ukurError = useAppSelector((state) => state.inventoryAlatukur.alat ukurError);

  // Data consumable untuk Universal Scanner
  const [consumables, setConsumables] = useState<ConsumableItemType[]>([]);

  // ---- State modal ----
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeAlatukur, setActiveAlatukur] = useState<AlatukurItemType | null>(null);
  const [suggestedKodeBarang, setSuggestedKodeBarang] = useState("");

  // ---- State Keranjang Peminjaman ----
  const [cart, setCart] = useState<UnifiedCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  // ---- Timer untuk Debounce API ----
  const debounceTimers = useRef<Map<string | number, NodeJS.Timeout>>(new Map());

  // ---- Animasi "fly to cart" ----
  const [flyAnimations, setFlyAnimations] = useState<FlyAnimationItem[]>([]);

  // ---- Notifikasi ----
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Alatukurbar: pencarian ----
  const [searchTerm, setSearchTerm] = useState("");

  // ================= FETCH KERANJANG MENGGUNAKAN SWR & SERVICE =================
  const { data: dbCart } = useSWR("/peminjaman/antrean", fetchAntrean);

  // Sinkronisasi data Alatukur dari Database + Gabungkan dengan data Consumable dari LocalStorage
  useEffect(() => {
    let groupedAlatukurCart: UnifiedCartItem[] = [];

    if (dbCart && Array.isArray(dbCart)) {
      groupedAlatukurCart = dbCart.reduce((acc: UnifiedCartItem[], item: AntreanItemResponse) => {
        const cartRecordId = item.id;
        const alat ukurIdVal = item.alat ukur_id;

        const existingItem = acc.find((c) => c.alat ukurId === alat ukurIdVal);

        if (existingItem) {
          existingItem.jumlah += item.qty ?? 1;
        } else {
          acc.push({
            cartId: cartRecordId,
            alat ukurId: alat ukurIdVal,
            namaBarang: item.nama_barang || "Nama Alat Tidak Ditemukan",
            kodeBarang: item.kode_barang || "-",
            jumlah: item.qty ?? 1,
            maxJumlah: item.max_jumlah ?? 99,
            item_type: "alat ukur",
          });
        }
        return acc;
      }, []);
    }
    // Simpan alat ukur ke localStorage agar halaman consumable bisa membacanya
    localStorage.setItem("global_shared_alat ukur_cart", JSON.stringify(groupedAlatukurCart));

    // Ambil data consumable dari localStorage
    const savedConsumableCart = JSON.parse(localStorage.getItem("global_shared_consumable_cart") || "[]");

    // Gabungkan data alat ukur dan consumable ke state cart utama
    setCart([...groupedAlatukurCart, ...savedConsumableCart]);
  }, [dbCart]);

  // Data filter tabel
  const filteredAlatukur = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    
    if (!keyword) return alat ukur;

    return alat ukur.filter((alat ukur) => {
      const kodeBarang = (alat ukur.kodeBarang || "").toLowerCase();
      const namaBarang = (alat ukur.namaBarang || "").toLowerCase();
      const merk = (alat ukur.merk || "").toLowerCase();
      const tipe = (alat ukur.tipe || "").toLowerCase();
      const warna = (alat ukur.warna || "").toLowerCase();
      const ukuran = (alat ukur.ukuran || "").toLowerCase();
      const kondisi = (alat ukur.kondisi || "").toLowerCase();

      const stok = String(alat ukur.stok || 0);
      const dipinjam = String(alat ukur.dipinjam || 0);
      const tersedia = String((alat ukur.stok || 0) - (alat ukur.dipinjam || 0));

      return (
        kodeBarang.includes(keyword) ||
        namaBarang.includes(keyword) ||
        merk.includes(keyword) ||
        tipe.includes(keyword) ||
        warna.includes(keyword) ||
        ukuran.includes(keyword) ||
        kondisi.includes(keyword) ||
        stok.includes(keyword) ||
        dipinjam.includes(keyword) ||
        tersedia.includes(keyword)
      );
    });
  }, [alat ukur, searchTerm]);

  // ================= LOAD DATA DARI DATABASE =================
  useEffect(() => {
    dispatch(fetchAlatukur());
    getConsumables().then(setConsumables).catch(console.error); // Load consumables untuk Universal Scanner
  }, [dispatch]);

  // ================= BARCODE SCANNER UNIVERSAL =================
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleGlobalScan = async (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime.current > 50) barcodeBuffer.current = '';
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 3) {
          const scannedCode = barcodeBuffer.current;
          barcodeBuffer.current = ''; 

          // 1. Cari di database Alatukur terlebih dahulu
          const foundAlatukur = alat ukur.find((t) => 
            (t.kodeBarang && t.kodeBarang.toLowerCase() === scannedCode.toLowerCase()) || t.id === scannedCode
          );

          if (foundAlatukur) {
            const tersedia = foundAlatukur.stok - foundAlatukur.dipinjam;
            if (tersedia > 0) {
              try {
                await scanAlatukur(foundAlatukur.id, 1);
                mutate("/peminjaman/antrean");
                setSuccessMessage(`Berhasil: Alatukur ${foundAlatukur.namaBarang} ditambahkan ke keranjang.`);
                setTimeout(() => setSuccessMessage(null), 3000);
              } catch (err) {
                console.error("Gagal menambah Alatukur", err);
              }
            } else {
               alert(`Gagal: Stok Alatukur ${foundAlatukur.namaBarang} kosong/dipinjam semua.`);
            }
          } 
          // 2. Jika tidak ada di Alatukur, cari di database Consumable
          else {
            const foundConsumable = consumables.find((c) => 
              (c.kode_barang && c.kode_barang.toLowerCase() === scannedCode.toLowerCase()) || c.id === scannedCode
            );

            if (foundConsumable) {
              const itemDiKeranjang = cart.find((c) => c.consumable_id === foundConsumable.id && c.item_type === 'consumable');
              const jumlahDiKeranjang = itemDiKeranjang ? itemDiKeranjang.jumlah : 0;
              const tersedia = foundConsumable.stok_tersedia - jumlahDiKeranjang;

              if (tersedia > 0) {
                try {
                  const token = localStorage.getItem("token");
                  const userId = localStorage.getItem("userId");
                  
                  // Tembak API Consumable
                  await api("/consumable-keluar/scan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ consumable_id: foundConsumable.id, jumlah: 1, ...(userId ? { user_id: userId } : {}) }),
                  });

                  // Sinkronisasi data keranjang consumable dari API ke LocalStorage
                  const json = await api("/consumable-keluar/antrean", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, ...(userId ? { "x-user-id": userId } : {}) },
                  });
                  const rawItems = Array.isArray(json) ? json : (json as any).data || [];
                  const mappedConsumable = rawItems.map((item: any) => ({
                    id: item.id, consumable_id: item.consumable_id,
                    kode_barang: item.kodeBarang || item.kode_barang || "-",
                    nama: item.namaBarang || item.nama || "Bahan Dihapus",
                    jumlah: item.qty || item.jumlah || 1,
                    stok_tersedia: item.stok_tersedia ?? 0, item_type: 'consumable',
                  }));
                  localStorage.setItem("global_shared_consumable_cart", JSON.stringify(mappedConsumable));
                  
                  mutate("/peminjaman/antrean"); // Trigger update UI
                  setSuccessMessage(`Berhasil: Consumable ${foundConsumable.nama} ditambahkan ke keranjang.`);
                  setTimeout(() => setSuccessMessage(null), 3000);
                } catch (err) {
                  console.error("Gagal menambah Consumable", err);
                }
              } else {
                 alert(`Gagal: Stok Consumable ${foundConsumable.nama} habis!`);
              }
            } else {
               alert(`Barcode tidak terdaftar di sistem manapun: ${scannedCode}`);
            }
          }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalScan);
    return () => window.removeEventListener('keydown', handleGlobalScan);
  }, [alat ukur, consumables, cart, mutate]);

  // ================= CRUD ALAT UKUR =================
  const openAddModal = () => {
    setActiveAlatukur(null);
    setSuggestedKodeBarang(generateNextKodeBarang(alat ukur));
    setFormModalOpen(true);
  };

  const openEditModal = (alat ukur: AlatukurItemType) => {
    setActiveAlatukur(alat ukur);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (values: AlatukurFormValues) => {
    try {
      if (activeAlatukur) {
        await dispatch(updateAlatukurThunk({ id: activeAlatukur.id, values })).unwrap();
      } else {
        await dispatch(addAlatukurThunk(values)).unwrap();
      }
      setFormModalOpen(false);
      setActiveAlatukur(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan data";
      alert(message);
    }
  }; 

  const openDetailModal = (alat ukur: AlatukurItemType) => {
    setActiveAlatukur(alat ukur);
    setDetailModalOpen(true);
  };

  const handleExportPDF = () => {
    const dataWithTersedia = filteredAlatukur.map((t) => ({
      ...t,
      tersedia: t.stok - t.dipinjam,
    }));
    exportToPDF(dataWithTersedia as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-alat ukur", "Data Alatukur");
  };

  const handleExportExcel = () => {
    const dataWithTersedia = filteredAlatukur.map((t) => ({
      ...t,
      tersedia: t.stok - t.dipinjam,
    }));
    exportToExcel(dataWithTersedia as unknown as Record<string, unknown>[], EXPORT_COLUMNS, "data-alat ukur");
  };

  const openDeleteModal = (alat ukur: AlatukurItemType) => {
    setActiveAlatukur(alat ukur);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeAlatukur) return;
    try {
      await dispatch(deleteAlatukurThunk(activeAlatukur.id)).unwrap();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus data";
      alert(message);
    } finally {
      setDeleteModalOpen(false);
      setActiveAlatukur(null);
    }
  };

  // ================= KERANJANG PEMINJAMAN =================
  const handleAddToCart = useCallback(async (alat ukur: AlatukurItemType, event: React.MouseEvent<HTMLButtonElement>) => {
    const tersedia = alat ukur.stok - alat ukur.dipinjam;
    if (tersedia <= 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setFlyAnimations((prev) => [
      ...prev, 
      { id: uuid(), startX: rect.left + rect.width / 2, startY: rect.top + rect.height / 2 }
    ]);

    try {
      await scanAlatukur(alat ukur.id, 1);
      mutate("/peminjaman/antrean");
    } catch (err) { 
      console.error("Gagal menambah ke keranjang DB", err); 
    }
  }, [mutate]);
  
  const handleAnimationEnd = (id: string) => {
    setFlyAnimations((prev) => prev.filter((a) => a.id !== id));
  };

  // --- OPTIMISTIC UPDATE + DEBOUNCE: handleUpdateQty ---
  const handleUpdateQty = (cartId: string | number, newJumlah: number) => {
    if (newJumlah < 1) return;

    // 1. Update state lokal secara instan (UI merespons tanpa lag)
    setCart((prevCart) =>
      prevCart.map((c) =>
        c.cartId === cartId || c.id === cartId || c.consumable_id === cartId ? { ...c, jumlah: newJumlah } : c
      )
    );

    const targetItem = cart.find((c) => c.cartId === cartId || c.id === cartId || c.consumable_id === cartId);
    if (!targetItem) return;

    // 2. Simpan juga ke Local Storage seketika agar sinkron
    if (targetItem.item_type === "consumable") {
      const savedCons = JSON.parse(localStorage.getItem("global_shared_consumable_cart") || "[]");
      const updated = savedCons.map((c: any) => 
        c.id === cartId || c.consumable_id === cartId ? { ...c, jumlah: newJumlah } : c
      );
      localStorage.setItem("global_shared_consumable_cart", JSON.stringify(updated));
    } else {
      const savedAlatukur = JSON.parse(localStorage.getItem("global_shared_alat ukur_cart") || "[]");
      const updated = savedAlatukur.map((c: any) =>
        c.cartId === cartId || c.id === cartId ? { ...c, jumlah: newJumlah } : c
      );
      localStorage.setItem("global_shared_alat ukur_cart", JSON.stringify(updated));
    }

    // 3. Batalkan request API sebelumnya jika user masih asyik mengetik/ngeklik
    if (debounceTimers.current.has(cartId)) {
      clearTimeout(debounceTimers.current.get(cartId));
    }

    // 4. Jadwalkan pengiriman API setelah user berhenti 500ms
    const timer = setTimeout(async () => {
      try {
        if (targetItem.item_type === "consumable") {
          const token = localStorage.getItem("token");
          await api(`/consumable-keluar/cart/${targetItem.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ qty: newJumlah }),
          });
        } else {
          // Update item jenis Alatukur ke backend
          await updateCartItem(cartId, newJumlah);
        }

        debounceTimers.current.delete(cartId);
        
        // Mutate secara silent agar UI tidak jumpy, karena layar sudah benar angkanya
        mutate("/peminjaman/antrean"); 
      } catch (err) {
        console.error("Gagal memperbarui jumlah item:", err);
        // Jika backend menolak (misal error server/stok limit), paksa ambil nilai asli dari database
        mutate("/peminjaman/antrean");
      }
    }, 500);

    debounceTimers.current.set(cartId, timer);
  };

  // --- PERBAIKAN BUG OPTIMISTIC UPDATE: handleRemoveFromCart ---
  const handleRemoveFromCart = async (cartId: string | number) => {
    const targetItem = cart.find((c) => c.cartId === cartId || c.id === cartId || c.consumable_id === cartId);
    if (!targetItem) return;

    // 1. Hapus secara instan dari state lokal
    setCart((prev) => prev.filter((c) => c.cartId !== cartId && c.id !== cartId && c.consumable_id !== cartId));

    // 2. Jika item tersebut adalah Consumable
    if (targetItem.item_type === "consumable") {
      const savedCons = JSON.parse(localStorage.getItem("global_shared_consumable_cart") || "[]");
      const updated = savedCons.filter((c: any) => c.id !== cartId && c.consumable_id !== cartId);
      localStorage.setItem("global_shared_consumable_cart", JSON.stringify(updated));
      return;
    }

    // 3. Jika item tersebut adalah Alatukur
    try {
      await removeCartItem(cartId);
      mutate("/peminjaman/antrean"); 
    } catch (err) {
      console.error("Gagal menghapus dari keranjang DB", err);
      mutate("/peminjaman/antrean"); // Revert jika gagal
    }
  };

  const handleProceedToLoanForm = () => {
    setCartOpen(false);
    setLoanFormOpen(true);
  };

  const handleLoanSubmit = async (values: LoanSubmitValues) => {
    setSubmittingLoan(true);
    setLoanError(null);

    try {
      const dicatatOleh = localStorage.getItem("userId"); 
      const token = localStorage.getItem("token");
      if (!dicatatOleh || !token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      const pemintaIdValue = values.peminjamId || values.pemintaId;
      if (!pemintaIdValue) {
        throw new Error("Data peminjam tidak ditemukan. Silakan pilih peminjam terlebih dahulu.");
      }

      const hasAlatukurItems = cart.some((c) => c.item_type === "alat ukur" || !c.item_type);
      const hasConsumableItems = cart.some((c) => c.item_type === "consumable");

      const apiRequests = [];

      if (hasAlatukurItems) {
        apiRequests.push(
          prosesPeminjamanApi({
            pemintaId: pemintaIdValue,
            dicatatOleh: dicatatOleh,
            namaPekerjaan: values.namaPekerjaan,
            areaKerja: values.areaKerja,
            spesifikasi: values.spesifikasi || "",
            keterangan: values.keterangan,
          })
        );
      }

      if (hasConsumableItems) {
        apiRequests.push(
          api("/consumable-keluar/proses", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              peminta_id: pemintaIdValue,
              nama_pekerjaan: values.namaPekerjaan,
              pekerjaan_area: values.areaKerja,
              keterangan: values.keterangan || "",
              dicatat_oleh: dicatatOleh,
            }),
          })
        );
      }

      if (apiRequests.length > 0) {
        await Promise.all(apiRequests);
      }

      localStorage.removeItem("global_shared_consumable_cart");
      localStorage.removeItem("global_shared_alat ukur_cart");

      setCart([]);
      setLoanFormOpen(false);
      mutate("/peminjaman/antrean");
      dispatch(fetchAlatukur());

      setSuccessMessage(
        `Peminjaman untuk ${values.namaPeminjam || values.namaPeminta} berhasil dibuat. Status: Sedang Dipinjam.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat peminjaman";
      setLoanError(message);
    } finally {
      setSubmittingLoan(false);
    }
  };

  const columns = useMemo(
    () =>
      getDataAlatukurColumns({
        onDetail: openDetailModal,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onAddToCart: handleAddToCart,
        cartItems: cart
          .filter((c) => c.item_type !== "consumable")
          .map((c) => ({
            alat ukurId: c.alat ukurId ?? "",
            cartId: c.cartId,
            kodeBarang: c.kodeBarang ?? "-",
            namaBarang: c.namaBarang ?? "-",
            jumlah: c.jumlah,
            maxJumlah: c.maxJumlah ?? 99,
          })),
      }),
    [cart, handleAddToCart]
  );

  return (
    <div className="dataalat ukur-page">
      {successMessage && (
        <Alert variant="success" className="d-flex align-items-center gap-2" dismissible onClose={() => setSuccessMessage(null)}>
          <IconCircleCheck size={20} />
          {successMessage}
        </Alert>
      )}

      {loanError && (
        <Alert variant="danger" dismissible onClose={() => setLoanError(null)}>
          {loanError}
        </Alert>
      )}

      {/* ---- Page Header ---- */}
      <Row>
        <Col>
          <Flex justifyContent="between" alignItems="center" className="mb-4 w-100" breakpoint="md">
            <div>
              <h1 className="mb-2 h2">Data Alatukur</h1>
              <p className="text-secondary mb-0">
                Mengelola seluruh data peralatan yang terdapat di Ruang Alatukur.
              </p>
              <DasherBreadcrumb />
            </div>
            <div>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} />
                Tambah Data
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <Card className="card-lg mb-6">
        {/* ---- Alatukurbar: Search ---- */}
        <div className="dataalat ukur-alat ukurbar border-bottom">
          <Row className="g-2 align-items-center">
            <Col lg={5} md={6}>
              <InputGroup className="dataalat ukur-search">
                <InputGroup.Text><IconSearch size={18} /></InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Cari kode, nama, merk, atau informasi lainnya..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="link" className="dataalat ukur-search-clear" onClick={() => setSearchTerm("")}>
                    <IconX size={16} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={4} md={3} className="text-md-end">
              <span className="text-secondary small">
                Menampilkan <span className="fw-semibold text-body">{filteredAlatukur.length}</span> dari {alat ukur.length} data
              </span>
            </Col>
            <Col lg={3} md={3} className="d-flex justify-content-md-end gap-2">
              <Button variant="outline-danger" size="sm" onClick={handleExportPDF}>
                Export PDF
              </Button>
              <Button variant="outline-success" size="sm" onClick={handleExportExcel}>
                Export Excel
              </Button>
            </Col>
          </Row>
        </div>

        <CardBody>
          {alat ukurError && <Alert variant="danger">{alat ukurError}</Alert>}
          {loadingAlatukur ? (
            <div className="text-center py-6">
              <Spinner animation="border" size="sm" className="me-2" /> Memuat data...
            </div>
          ) : alat ukur.length === 0 ? (
            <div className="dataalat ukur-empty text-center py-6">
              <div className="dataalat ukur-empty-icon mb-3"><IconAlatukur size={32} /></div>
              <h5 className="mb-1">Belum ada data alat ukur</h5>
              <p className="text-secondary mb-4">Mulai dengan menambahkan peralatan pertama ke Ruang Alatukur.</p>
              <Button variant="primary" className="d-inline-flex align-items-center gap-2" onClick={openAddModal}>
                <IconPlus size={18} /> Tambah Data
              </Button>
            </div>
          ) : filteredAlatukur.length === 0 ? (
            <div className="dataalat ukur-empty text-center py-6">
              <div className="dataalat ukur-empty-icon mb-3"><IconMoodEmpty size={32} /></div>
              <h5 className="mb-1">Tidak ada hasil</h5>
              <p className="text-secondary mb-4">Tidak ditemukan data yang cocok dengan pencarian.</p>
              <Button variant="outline-secondary" className="d-inline-flex align-items-center gap-2" onClick={() => setSearchTerm("")}>
                <IconX size={18} /> Reset Pencarian
              </Button>
            </div>
          ) : (
            <TanstackTable data={filteredAlatukur} columns={columns} pagination />
          )}
        </CardBody>
      </Card>

      {/* ---- Modals ---- */}
      <AlatukurFormModal show={formModalOpen} onClose={() => { setFormModalOpen(false); setActiveAlatukur(null); }} onSubmit={handleFormSubmit} initialData={activeAlatukur} suggestedKodeBarang={suggestedKodeBarang} />
      <AlatukurDetailModal show={detailModalOpen} onClose={() => setDetailModalOpen(false)} alat ukur={activeAlatukur} />
      <DeleteConfirmModal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleConfirmDelete} alat ukur={activeAlatukur} />

      {/* ---- Keranjang Peminjaman ---- */}
      <CartFAB itemCount={cart.length} onClick={() => setCartOpen(true)} />
      <CartOffcanvas show={cartOpen} onClose={() => setCartOpen(false)} items={cart} onUpdateQty={handleUpdateQty} onRemove={handleRemoveFromCart} onProceed={handleProceedToLoanForm} />
      <AddToCartFlyEffect animations={flyAnimations} onAnimationEnd={handleAnimationEnd} />

      <LoanFormModal show={loanFormOpen} onClose={() => setLoanFormOpen(false)} onSubmit={handleLoanSubmit} cartItems={cart} submitting={submittingLoan} />
    </div>
  );
};

export default DataAlatukurManager;