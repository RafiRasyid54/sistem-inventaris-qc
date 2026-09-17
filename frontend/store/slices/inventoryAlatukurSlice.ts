import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";

import { v4 as uuid } from "uuid";

import {
  AlatUkur,
  AlatUkurFormValues,
  CartItemType,
  LoanFormValues,
  TransaksiPeminjamanType,
  PengembalianItemInput,
} from "../../types/DataAlatUkurTypes";

import {
  getSemuaAlatUkur,
  createAlatUkur as createAlatUkurApi,
  updateAlatUkur as updateAlatUkurApi,
  deleteAlatUkur as deleteAlatUkurApi,
} from "../../services/alatukurService";

import { submitPeminjaman } from "../../services/peminjamanService";

// ============================================================
// STATE
// ============================================================

interface InventoryAlatukurState {
  alatUkur: AlatUkur[];

  transaksiList: TransaksiPeminjamanType[];

  loadingAlatukur: boolean;

  alatukurError: string | null;

  checkoutError: string | null;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: InventoryAlatukurState = {
  alatUkur: [],

  transaksiList: [],

  loadingAlatukur: false,

  alatukurError: null,

  checkoutError: null,
};

// ============================================================
// FETCH SEMUA ALAT UKUR
// ============================================================

export const fetchAlatukur = createAsyncThunk(
  "inventoryAlatukur/fetchAlatukur",

  async (_, { rejectWithValue }) => {
    try {
      return await getSemuaAlatUkur();
    } catch (err: any) {
      return rejectWithValue(
        err?.message || "Gagal memuat data alat"
      );
    }
  }
);

// ============================================================
// TAMBAH ALAT UKUR
// ============================================================

export const addAlatukurThunk = createAsyncThunk(
  "inventoryAlatukur/addAlatukur",

  async (
    values: AlatUkurFormValues,
    { rejectWithValue }
  ) => {
    try {
      return await createAlatUkurApi(values);
    } catch (err: any) {
      return rejectWithValue(
        err?.message || "Gagal menambah data alat"
      );
    }
  }
);

// ============================================================
// UPDATE ALAT UKUR
// ============================================================

export const updateAlatukurThunk = createAsyncThunk(
  "inventoryAlatukur/updateAlatukur",

  async (
    {
      id,
      values,
    }: {
      id: string | number;
      values: AlatUkurFormValues;
    },

    { rejectWithValue }
  ) => {
    try {
      return await updateAlatUkurApi(
        String(id),
        values
      );
    } catch (err: any) {
      return rejectWithValue(
        err?.message ||
          "Gagal menyimpan perubahan alat"
      );
    }
  }
);

// ============================================================
// DELETE ALAT UKUR
// ============================================================

export const deleteAlatukurThunk = createAsyncThunk(
  "inventoryAlatukur/deleteAlatukur",

  async (
    id: string | number,
    { rejectWithValue }
  ) => {
    try {
      await deleteAlatUkurApi(String(id));

      return id;
    } catch (err: any) {
      return rejectWithValue(
        err?.message ||
          "Gagal menghapus data alat"
      );
    }
  }
);

// ============================================================
// CHECKOUT PEMINJAMAN
// ============================================================

export const checkoutPeminjamanThunk =
  createAsyncThunk(
    "inventoryAlatukur/checkoutPeminjaman",

    async (
      {
        loanForm,
        cartItems,
      }: {
        loanForm: LoanFormValues;
        cartItems: CartItemType[];
      },

      { getState, rejectWithValue }
    ) => {
      try {
        // ------------------------------------------------------
        // VALIDASI CART
        // ------------------------------------------------------

        if (!cartItems || cartItems.length === 0) {
          throw new Error(
            "Tidak ada alat ukur yang dipilih"
          );
        }

        // ------------------------------------------------------
        // VALIDASI PEMINJAM
        // ------------------------------------------------------

        if (!loanForm.peminjamId) {
          throw new Error(
            "Peminjam belum dipilih"
          );
        }

        // ------------------------------------------------------
        // VALIDASI NAMA PEKERJAAN
        // ------------------------------------------------------

        if (!loanForm.namaPekerjaan) {
          throw new Error(
            "Nama pekerjaan belum diisi"
          );
        }

        // ------------------------------------------------------
        // VALIDASI DICATAT OLEH
        // ------------------------------------------------------

        if (!loanForm.dicatatOleh) {
          throw new Error(
            "Data pencatat peminjaman belum tersedia"
          );
        }

        // ------------------------------------------------------
        // SUBMIT PEMINJAMAN
        // ------------------------------------------------------

        await submitPeminjaman(
          cartItems,

          loanForm.peminjamId,

          loanForm.areaKerja,

          loanForm.namaPekerjaan,

          loanForm.dicatatOleh,

          loanForm.spesifikasi,

          loanForm.keterangan
        );

        // ------------------------------------------------------
        // REFRESH DATA ALAT UKUR
        // ------------------------------------------------------

        const freshAlatUkur =
          await getSemuaAlatUkur();

        // ------------------------------------------------------
        // AMBIL STATE
        // ------------------------------------------------------

        const state =
          getState() as {
            inventoryAlatukur: InventoryAlatukurState;
          };

        // ------------------------------------------------------
        // BUAT ITEM TRANSAKSI
        // ------------------------------------------------------

        const items =
          cartItems.map(
            (
              cartItem: CartItemType
            ) => {
              const unit =
                state.inventoryAlatukur.alatUkur.find(
                  (alat) =>
                    String(alat.id) ===
                    String(
                      cartItem.alatUkurId
                    )
                );

              return {
                alatUkurId:
                  String(
                    cartItem.alatUkurId
                  ),

                kodeAlat:
                  cartItem.kodeAlat,

                namaAlat:
                  cartItem.namaAlat,

                kondisiSaatDipinjam:
                  unit?.kondisi ||
                  "Baik",
              };
            }
          );

        // ------------------------------------------------------
        // BUAT TRANSAKSI LOCAL REDUX
        // ------------------------------------------------------

        const transaksi: TransaksiPeminjamanType =
          {
            id: uuid(),

            tanggalPeminjaman:
              loanForm.tanggalPeminjaman,

            namaPeminjam:
              loanForm.namaPeminjam,

            divisi:
              loanForm.divisi,

            areaKerja:
              loanForm.areaKerja,

            status:
              "Sedang Dipinjam",

            items,
          };

        // ------------------------------------------------------
        // RETURN
        // ------------------------------------------------------

        return {
          freshAlatUkur,

          transaksi,
        };
      } catch (err: any) {
        return rejectWithValue(
          err?.message ||
            "Gagal membuat peminjaman"
        );
      }
    }
  );

// ============================================================
// SLICE
// ============================================================

const inventoryAlatukurSlice =
  createSlice({
    name: "inventoryAlatukur",

    initialState,

    reducers: {
      // ======================================================
      // PROSES PENGEMBALIAN
      // ======================================================

      prosesPengembalian: (
        state,

        action: PayloadAction<{
          transaksiId: string;

          returns: PengembalianItemInput[];
        }>
      ) => {
        const {
          transaksiId,
          returns,
        } = action.payload;

        // ----------------------------------------------------
        // CARI TRANSAKSI
        // ----------------------------------------------------

        const transaksi =
          state.transaksiList.find(
            (item) =>
              item.id === transaksiId
          );

        if (!transaksi) {
          return;
        }

        // ----------------------------------------------------
        // UPDATE KONDISI ALAT
        // ----------------------------------------------------

        returns.forEach(
          (ret) => {
            const unit =
              state.alatUkur.find(
                (alat) =>
                  String(alat.id) ===
                  String(
                    ret.alatUkurId
                  )
              );

            if (!unit) {
              return;
            }

            unit.kondisi =
              ret.kondisi;
          }
        );

        // ----------------------------------------------------
        // UPDATE STATUS TRANSAKSI
        // ----------------------------------------------------

        transaksi.status =
          "Selesai";
      },
    },

    // ========================================================
    // EXTRA REDUCERS
    // ========================================================

    extraReducers: (
      builder
    ) => {
      // ======================================================
      // FETCH ALAT UKUR
      // ======================================================

      builder.addCase(
        fetchAlatukur.pending,
        (state) => {
          state.loadingAlatukur =
            true;

          state.alatukurError =
            null;
        }
      );

      builder.addCase(
        fetchAlatukur.fulfilled,
        (
          state,
          action
        ) => {
          state.loadingAlatukur =
            false;

          state.alatUkur =
            action.payload;
        }
      );

      builder.addCase(
        fetchAlatukur.rejected,
        (
          state,
          action
        ) => {
          state.loadingAlatukur =
            false;

          state.alatukurError =
            action.payload as string;
        }
      );

      // ======================================================
      // ADD ALAT UKUR
      // ======================================================

      builder.addCase(
        addAlatukurThunk.fulfilled,
        (
          state,
          action
        ) => {
          state.alatUkur.unshift(
            action.payload
          );
        }
      );

      // ======================================================
      // UPDATE ALAT UKUR
      // ======================================================

      builder.addCase(
        updateAlatukurThunk.fulfilled,
        (
          state,
          action
        ) => {
          const index =
            state.alatUkur.findIndex(
              (alat) =>
                String(alat.id) ===
                String(
                  action.payload.id
                )
            );

          if (index !== -1) {
            state.alatUkur[index] =
              action.payload;
          }
        }
      );

      // ======================================================
      // DELETE ALAT UKUR
      // ======================================================

      builder.addCase(
        deleteAlatukurThunk.fulfilled,
        (
          state,
          action
        ) => {
          state.alatUkur =
            state.alatUkur.filter(
              (alat) =>
                String(alat.id) !==
                String(
                  action.payload
                )
            );
        }
      );

      // ======================================================
      // CHECKOUT PENDING
      // ======================================================

      builder.addCase(
        checkoutPeminjamanThunk.pending,
        (state) => {
          state.checkoutError =
            null;
        }
      );

      // ======================================================
      // CHECKOUT SUCCESS
      // ======================================================

      builder.addCase(
        checkoutPeminjamanThunk.fulfilled,
        (
          state,
          action
        ) => {
          state.alatUkur =
            action.payload.freshAlatUkur;

          state.transaksiList.unshift(
            action.payload.transaksi
          );
        }
      );

      // ======================================================
      // CHECKOUT ERROR
      // ======================================================

      builder.addCase(
        checkoutPeminjamanThunk.rejected,
        (
          state,
          action
        ) => {
          state.checkoutError =
            action.payload as string;
        }
      );
    },
  });

// ============================================================
// EXPORT ACTION
// ============================================================

export const {
  prosesPengembalian,
} =
  inventoryAlatukurSlice.actions;

// ============================================================
// EXPORT REDUCER
// ============================================================

export default inventoryAlatukurSlice.reducer;