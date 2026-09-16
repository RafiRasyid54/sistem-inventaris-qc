// import node module libraries
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/alat ukurkit";
import { v4 as uuid } from "uuid";

// import custom types
import {
  AlatukurItemType,
  AlatukurFormValues,
  CartItemType,
  LoanFormValues,
  TransaksiPeminjamanType,
  PengembalianItemInput,
  KerusakanHistoryType,
} from "types/DataAlatukurTypes";

// import API services (sudah terhubung ke Laravel)
import {
  getAlatukur,
  createAlatukur as createAlatukurApi,
  updateAlatukur as updateAlatukurApi,
  deleteAlatukur as deleteAlatukurApi,
} from "services/alat Ukurervice";
import { submitPeminjaman } from "services/peminjamanService";

interface InventoryAlatukurState {
  alat ukur: AlatukurItemType[];
  transaksiList: TransaksiPeminjamanType[];
  kerusakanHistory: KerusakanHistoryType[];
  loadingAlatukur: boolean;
  alat ukurError: string | null;
  checkoutError: string | null;
}

const initialState: InventoryAlatukurState = {
  alat ukur: [],
  transaksiList: [],
  kerusakanHistory: [],
  loadingAlatukur: false,
  alat ukurError: null,
  checkoutError: null,
};

// ================= THUNKS (manggil Laravel API) =================

// Ambil semua data alat ukur dari backend. Panggil ini sekali di halaman utama (mount).
export const fetchAlatukur = createAsyncThunk(
  "inventoryAlatukur/fetchAlatukur",
  async (_: void, { rejectWithValue }) => {
    try {
      return await getAlatukur();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data alat";
      return rejectWithValue(message);
    }
  }
);

export const addAlatukurThunk = createAsyncThunk(
  "inventoryAlatukur/addAlatukur",
  async (values: AlatukurFormValues, { rejectWithValue }) => {
    try {
      return await createAlatukurApi(values);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menambah data alat";
      return rejectWithValue(message);
    }
  }
);

export const updateAlatukurThunk = createAsyncThunk(
  "inventoryAlatukur/updateAlatukur",
  async (
    { id, values }: { id: string; values: AlatukurFormValues },
    { rejectWithValue }
  ) => {
    try {
      return await updateAlatukurApi(id, values);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan perubahan alat";
      return rejectWithValue(message);
    }
  }
);

export const deleteAlatukurThunk = createAsyncThunk(
  "inventoryAlatukur/deleteAlatukur",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteAlatukurApi(id);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus data alat";
      return rejectWithValue(message);
    }
  }
);

// Checkout keranjang peminjaman -> kirim tiap item ke POST /api/peminjaman,
// lalu refetch alat ukur supaya kolom "dipinjam"/"tersedia" akurat sesuai server.
export const checkoutPeminjamanThunk = createAsyncThunk(
  "inventoryAlatukur/checkoutPeminjaman",
  async (
    {
      loanForm,
      cartItems,
      dicatatOleh,
    }: {
      loanForm: LoanFormValues;
      cartItems: CartItemType[];
      dicatatOleh: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      await submitPeminjaman(
        cartItems,
        loanForm.peminjamId,
        loanForm.areaKerja,
        dicatatOleh,
        loanForm.spesifikasi,
        loanForm.keterangan
      );

      // ambil ulang data alat ukur terbaru dari server (dipinjam/tersedia sudah akurat)
      const freshAlatukur = await getAlatukur();

      // bangun entri transaksi lokal untuk ditampilkan langsung di UI
      const state = getState() as { inventoryAlatukur: InventoryAlatukurState };
      const items = cartItems.map((c) => {
        const alat ukur = state.inventoryAlatukur.alat ukur.find((t) => t.id === c.alat ukurId);
        return {
          alat ukurId: c.alat ukurId,
          kodeBarang: c.kodeBarang,
          namaBarang: c.namaBarang,
          jumlah: c.jumlah,
          kondisiSaatDipinjam: alat ukur?.kondisi || "Baik",
        };
      });

      const transaksi: TransaksiPeminjamanType = {
        id: uuid(),
        tanggalPeminjaman: loanForm.tanggalPeminjaman,
        namaPeminjam: loanForm.namaPeminjam,
        divisi: loanForm.divisi,
        areaKerja: loanForm.areaKerja,
        items,
        status: "Sedang Dipinjam",
      };

      return { freshAlatukur, transaksi };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal membuat peminjaman";
      return rejectWithValue(message);
    }
  }
);

const inventoryAlatukurSlice = createSlice({
  name: "inventoryAlatukur",
  initialState,
  reducers: {
    // ---- Pengembalian & riwayat kerusakan: MASIH DUMMY, backend belum ada ----
    // Sengaja belum disambungkan ke API. Jangan dipakai untuk data final dulu.
    prosesPengembalian: (
      state,
      action: PayloadAction<{
        transaksiId: string;
        returns: PengembalianItemInput[];
      }>
    ) => {
      const { transaksiId, returns } = action.payload;
      const transaksi = state.transaksiList.find((t) => t.id === transaksiId);
      if (!transaksi) return;

      returns.forEach((ret) => {
        const alat ukur = state.alat ukur.find((t) => t.id === ret.alat ukurId);
        if (!alat ukur) return;

        alat ukur.dipinjam = Math.max(alat ukur.dipinjam - ret.jumlah, 0);

        if (ret.kondisi === "Baik") {
          // tidak ada aksi tambahan -> tersedia otomatis bertambah
        } else {
          alat ukur.stok = Math.max(alat ukur.stok - ret.jumlah, 0);
          alat ukur.kondisi = ret.kondisi;

          state.kerusakanHistory.unshift({
            id: uuid(),
            tanggal: new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            kodeBarang: ret.kodeBarang,
            namaBarang: ret.namaBarang,
            jumlah: ret.jumlah,
            kondisi: ret.kondisi,
            catatan: ret.catatan,
            namaPeminjam: transaksi.namaPeminjam,
            divisi: transaksi.divisi,
          });
        }
      });

      transaksi.status = "Selesai";
    },
  },
  extraReducers: (builder) => {
    // ---- fetchAlatukur ----
    builder
      .addCase(fetchAlatukur.pending, (state) => {
        state.loadingAlatukur = true;
        state.alat ukurError = null;
      })
      .addCase(fetchAlatukur.fulfilled, (state, action) => {
        state.loadingAlatukur = false;
        state.alat ukur = action.payload;
      })
      .addCase(fetchAlatukur.rejected, (state, action) => {
        state.loadingAlatukur = false;
        state.alat ukurError = (action.payload as string) || "Gagal memuat data alat";
      });

    // ---- addAlatukurThunk ----
    builder.addCase(addAlatukurThunk.fulfilled, (state, action) => {
      state.alat ukur.unshift(action.payload);
    });

    // ---- updateAlatukurThunk ----
    builder.addCase(updateAlatukurThunk.fulfilled, (state, action) => {
      const idx = state.alat ukur.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.alat ukur[idx] = action.payload;
    });

    // ---- deleteAlatukurThunk ----
    builder.addCase(deleteAlatukurThunk.fulfilled, (state, action) => {
      state.alat ukur = state.alat ukur.filter((t) => t.id !== action.payload);
    });

    // ---- checkoutPeminjamanThunk ----
    builder
      .addCase(checkoutPeminjamanThunk.pending, (state) => {
        state.checkoutError = null;
      })
      .addCase(checkoutPeminjamanThunk.fulfilled, (state, action) => {
        state.alat ukur = action.payload.freshAlatukur;
        state.transaksiList.unshift(action.payload.transaksi);
      })
      .addCase(checkoutPeminjamanThunk.rejected, (state, action) => {
        state.checkoutError = (action.payload as string) || "Gagal membuat peminjaman";
      });
  },
});

export const { prosesPengembalian } = inventoryAlatukurSlice.actions;

export default inventoryAlatukurSlice.reducer;