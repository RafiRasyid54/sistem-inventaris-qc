import apiFetch from "/lib/api";

// Service untuk Order Alatukur — mirror dari orderConsumableService,
// dengan endpoint /order-alat ukur dan sumber data dari /alat ukur (Data Alatukur).
export const getOrderAlatukur = async (status?: string) => {
  const query = status && status !== 'semua' ? `?status_pembelian=${encodeURIComponent(status)}` : '';
  const json = await apiFetch<any>(`/order-alat ukur${query}`);
  return json.data || json;
};

export const updateOrderAlatukurStatus = async (id: number, status: string, tanggal_kedatangan?: string) => {
  return await apiFetch<any>(`/order-alat ukur/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status_pembelian: status,
      ...(tanggal_kedatangan && { tanggal_kedatangan }),
    }),
  });
};

// Daftar pegawai/pengusul (sama seperti Order Consumable)
export const getPemintaListForAlatukur = async () => {
  const json = await apiFetch<any>("/peminta");
  return json.data || json;
};

// Daftar alat dari Data Alatukur (bukan consumable)
export const getAlatukurList = async () => {
  const json = await apiFetch<any>("/alat ukur");
  return json.data || json;
};

export const createOrderAlatukur = async (data: any) => {
  return await apiFetch<any>("/order-alat ukur", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateOrderAlatukur = async (id: number, data: any) => {
  return await apiFetch<any>(`/order-alat ukur/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteOrderAlatukur = async (id: number) => {
  return await apiFetch<any>(`/order-alat ukur/${id}`, {
    method: "DELETE",
  });
};