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
  LoanFormValues as BaseLoanFormValues,
  TransaksiPeminjamanType,
  PengembalianItemInput,
} from "../../types/DataAlatUkurTypes";

import {
  getSemuaAlatUkur,
  createAlatUkur as createAlatUkurApi,
  updateAlatUkur as updateAlatUkurApi,
  deleteAlatUkur as deleteAlatUkurApi,
} from "../../services/alatukurService";

import { prosesPeminjamanApi } from "../../services/peminjamanService";

// Perluas tipe LoanFormValues untuk menyertakan pekerjaanId secara aman
export interface LoanFormValues extends BaseLoanFormValues {
  pekerjaanId?: string | number;
}

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
        if (!cartItems || cartItems.length === 0) {
          throw new Error(
            "Tidak ada alat ukur yang dipilih"
          );
        }

        if (!loanForm.peminjamId) {
          throw new Error(
            "Peminjam belum dipilih"
          );
        }

        if (!loanForm.namaPekerjaan) {
          throw new Error(
            "Nama pekerjaan belum diisi"
          );
        }

        for (const item of cartItems) {
          await prosesPeminjamanApi({
            kodeAlat: item.kodeAlat,
            pemintaId: loanForm.peminjamId,
            pekerjaanId: loanForm.pekerjaanId ?? "", // <-- Berikan fallback jika undefined
            keterangan: loanForm.keterangan,
          });
        }

        const freshAlatUkur =
          await getSemuaAlatUkur();
 
        const state =
          getState() as {
            inventoryAlatukur: InventoryAlatukurState;
          };

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

        const transaksi =
          state.transaksiList.find(
            (item) =>
              item.id === transaksiId
          );

        if (!transaksi) {
          return;
        }

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

        transaksi.status =
          "Selesai";
      },
    },

    extraReducers: (
      builder
    ) => {
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

      builder.addCase(
        checkoutPeminjamanThunk.pending,
        (state) => {
          state.checkoutError =
            null;
        }
      );

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

export const {
  prosesPengembalian,
} =
  inventoryAlatukurSlice.actions;

export default inventoryAlatukurSlice.reducer;