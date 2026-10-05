"use client";
import { useState, useMemo } from "react";
import { Table, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { IconArrowLeft, IconSearch, IconX, IconAlertTriangle } from "@tabler/icons-react";


export type JenisKerusakan = "bisa_diperbaiki" | "rusak_permanen";

export interface PengembalianGroupItem {
  id: string; // dipakai toolId sebagai id grup
  toolId: string;
  kodeBarang: string;
  namaBarang: string;
  jumlah: number; // total gabungan dari semua transaksi pinjam alat ini
}

interface ChecklistState {
  [id: string]: {
    checked: boolean;
    jumlahDikembalikan: number;
    jumlahBisaDiperbaiki: number;
    jumlahRusakPermanen: number;
    catatanBisaDiperbaiki: string;
    catatanRusakPermanen: string;
  };
}

export interface PengembalianKerusakanEntry {
  jenisKerusakan: JenisKerusakan;
  jumlah: number;
  catatan: string;
}

export interface PengembalianBatchItem {
  id: string;
  toolId: string;
  namaBarang: string;
  jumlahDikembalikan: number;
  kerusakan: PengembalianKerusakanEntry[];
}

interface PengembalianChecklistProps {
  namaPeminjam: string;
  items: PengembalianGroupItem[];
  onBack: () => void;
  onSubmit: (items: PengembalianBatchItem[]) => void;
  submitting?: boolean;
}

const emptyRow = (jumlahDipinjam: number) => ({
  checked: false,
  jumlahDikembalikan: jumlahDipinjam,
  jumlahBisaDiperbaiki: 0,
  jumlahRusakPermanen: 0,
  catatanBisaDiperbaiki: "",
  catatanRusakPermanen: "",
});

// Gaya checklist pengembalian. Selector diawali .pln-pc.
const CSS = `
.pln-pc{background:#fff;border:1px solid #dbe5f1;border-top:4px solid #0b6bb8;border-radius:16px;overflow:hidden}
.pln-pc .pc-head{padding:18px 22px;display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center}
.pln-pc .pc-who{display:flex;align-items:center;gap:14px;min-width:0}
.pln-pc .pc-av{width:46px;height:46px;border-radius:14px;background:#ffc20e;color:#06355f;font-weight:800;font-size:1.15rem;
  display:grid;place-items:center;flex:none}
.pln-pc .pc-lb{font-size:.76rem;color:#62708a;display:block}
.pln-pc .pc-name{font-size:1.1rem;font-weight:800;color:#06355f;margin:0}
.pln-pc .pc-back{background:#eef3f9;border:0;color:#06355f;font-weight:700;border-radius:10px;display:inline-flex;align-items:center;gap:6px}
.pln-pc .pc-back:hover{background:#e0e9f4;color:#06355f}
.pln-pc .pc-bar{padding:12px 22px;border-top:1px solid #dbe5f1;border-bottom:1px solid #dbe5f1;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.pln-pc .pc-bar .form-control:focus,.pln-pc .pc-body .form-control:focus,.pln-pc .pc-body .form-select:focus{
  border-color:#0b6bb8;box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-pc .pc-count{margin-left:auto;font-size:.82rem;color:#62708a}
.pln-pc .pc-count b{color:#06355f}
.pln-pc .pc-body{padding:14px 22px 20px}
.pln-pc .pc-err{border:0;border-radius:12px;display:flex;align-items:flex-start;gap:10px;font-size:.88rem}

.pln-pc .pc-table thead th{background:#eef5fc;color:#06355f;font-size:.8rem;font-weight:700;padding:11px 12px;border:0;white-space:nowrap}
.pln-pc .pc-table thead th:first-child{border-radius:10px 0 0 10px}
.pln-pc .pc-table thead th:last-child{border-radius:0 10px 10px 0}
.pln-pc .pc-table tbody td{padding:12px;border-color:#edf2f8;vertical-align:top}
.pln-pc .pc-table tbody tr.is-on>td{background:#fff9e3}
.pln-pc .pc-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.pln-pc .pc-hint{font-size:.72rem;color:#b36b00;margin-top:3px}
.pln-pc .pc-check{width:1.15rem;height:1.15rem;cursor:pointer}
.pln-pc .pc-check:checked{background-color:#0b6bb8;border-color:#0b6bb8}

.pln-pc .pc-foot{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;
  margin-top:16px;padding-top:16px;border-top:1px solid #dbe5f1}
.pln-pc .pc-chip{font-size:.84rem;font-weight:700;padding:6px 14px;border-radius:99px;background:#e6f0fa;color:#06355f}
.pln-pc .pc-chip.on{background:#ffc20e}
.pln-pc .pc-go{border:0;border-radius:12px;padding:10px 22px;font-weight:700;background:#ffc20e;color:#06355f}
.pln-pc .pc-go:hover:not(:disabled){background:#ffc20e;color:#06355f;filter:brightness(1.06)}
.pln-pc .pc-go:disabled{background:#eef3f9;color:#8794a8}
`;

const PengembalianChecklist = ({
  namaPeminjam,
  items,
  onBack,
  onSubmit,
  submitting = false,
}: PengembalianChecklistProps) => {
  const [state, setState] = useState<ChecklistState>(() => {
    const initial: ChecklistState = {};
    items.forEach((item) => {
      initial[item.id] = emptyRow(item.jumlah);
    });
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (item) =>
        item.namaBarang.toLowerCase().includes(keyword) ||
        item.kodeBarang.toLowerCase().includes(keyword)
    );
  }, [items, searchTerm]);

  const jumlahDicentang = useMemo(
    () => Object.values(state).filter((s) => s.checked).length,
    [state]
  );

  const toggleCheck = (id: string) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }));
  };

  const updateField = (
    id: string,
    field: keyof ChecklistState[string],
    value: number | string
  ) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleDikembalikanChange = (id: string, jumlahDikembalikan: number) => {
    setState((prev) => {
      const row = prev[id];
      const jumlahBisaDiperbaiki = Math.min(row.jumlahBisaDiperbaiki, jumlahDikembalikan);
      const jumlahRusakPermanen = Math.min(
        row.jumlahRusakPermanen,
        jumlahDikembalikan - jumlahBisaDiperbaiki
      );
      return {
        ...prev,
        [id]: { ...row, jumlahDikembalikan, jumlahBisaDiperbaiki, jumlahRusakPermanen },
      };
    });
  };

  const handleSubmit = () => {
    const dipilih = items.filter((item) => state[item.id]?.checked);

    if (dipilih.length === 0) {
      setError("Pilih minimal 1 alat untuk dikembalikan.");
      return;
    }

    for (const item of dipilih) {
      const row = state[item.id];

      if (row.jumlahDikembalikan < 1 || row.jumlahDikembalikan > item.jumlah) {
        setError(
          `Jumlah dikembalikan untuk "${item.namaBarang}" harus antara 1 - ${item.jumlah}.`
        );
        return;
      }

      const totalRusak = row.jumlahBisaDiperbaiki + row.jumlahRusakPermanen;
      if (totalRusak > row.jumlahDikembalikan) {
        setError(
          `Total rusak untuk "${item.namaBarang}" (${totalRusak}) melebihi jumlah yang dikembalikan (${row.jumlahDikembalikan}).`
        );
        return;
      }
      if (row.jumlahBisaDiperbaiki > 0 && row.catatanBisaDiperbaiki.trim() === "") {
        setError(`Catatan "Bisa Diperbaiki" untuk "${item.namaBarang}" wajib diisi.`);
        return;
      }
      if (row.jumlahRusakPermanen > 0 && row.catatanRusakPermanen.trim() === "") {
        setError(`Catatan "Rusak Permanen" untuk "${item.namaBarang}" wajib diisi.`);
        return;
      }
    }

    setError(null);

    const payload: PengembalianBatchItem[] = dipilih.map((item) => {
      const row = state[item.id];
      const kerusakan: PengembalianKerusakanEntry[] = [];

      if (row.jumlahBisaDiperbaiki > 0) {
        kerusakan.push({
          jenisKerusakan: "bisa_diperbaiki",
          jumlah: row.jumlahBisaDiperbaiki,
          catatan: row.catatanBisaDiperbaiki,
        });
      }
      if (row.jumlahRusakPermanen > 0) {
        kerusakan.push({
          jenisKerusakan: "rusak_permanen",
          jumlah: row.jumlahRusakPermanen,
          catatan: row.catatanRusakPermanen,
        });
      }

      return {
        id: item.id,
        toolId: item.toolId,               // Tetap kirim untuk kompabilitas internal komponen
        tool_id: item.toolId,              // FORMAT SNAKE_CASE WAJIB UNTUK BACKEND (TOOLS)
        alat_ukur_id: item.toolId,         // FORMAT WAJIB UNTUK BACKEND (ALAT UKUR)
        namaBarang: item.namaBarang,
        jumlahDikembalikan: row.jumlahDikembalikan,
        kerusakan,
      };
    });

    onSubmit(payload);
  };

  const inisial = (namaPeminjam || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="pengembalian-checklist pln-pc">
      <style>{CSS}</style>

      <div className="pc-head">
        <div className="pc-who">
          <span className="pc-av">{inisial}</span>
          <div className="min-w-0">
            <span className="pc-lb">Peminjam</span>
            <h5 className="pc-name">{namaPeminjam}</h5>
          </div>
        </div>
        <Button className="pc-back" size="sm" onClick={onBack} disabled={submitting}>
          <IconArrowLeft size={16} />
          Scan ulang
        </Button>
      </div>

      <div className="pc-bar">
        <InputGroup style={{ maxWidth: 320 }}>
          <InputGroup.Text>
            <IconSearch size={18} />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Cari nama atau kode alat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Cari alat"
          />
          {searchTerm && (
            <Button
              variant="link"
              className="riwayat-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Bersihkan pencarian"
            >
              <IconX size={16} />
            </Button>
          )}
        </InputGroup>
        <span className="pc-count">
          Menampilkan <b>{filteredItems.length}</b> dari {items.length} alat
        </span>
      </div>

      <div className="pc-body">
        {error && (
          <Alert variant="danger" className="pc-err">
            <IconAlertTriangle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </Alert>
        )}

        {items.length === 0 ? (
          <p className="text-secondary small mb-0">
            Peminjam ini tidak sedang memiliki alat yang dipinjam.
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="text-secondary small mb-0">
            Tidak ada alat yang cocok dengan pencarian.
          </p>
        ) : (
          <>
            <Table responsive className="align-middle mb-0 pengembalian-table pc-table" style={{ tableLayout: "fixed", minWidth: 760 }}>
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "25.5%" }} />
                <col style={{ width: "25.5%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>Alat</th>
                  <th>Dipinjam</th>
                  <th>Dikembalikan</th>
                  <th><i className="pc-dot" style={{ background: "#f08a00" }} />Bisa diperbaiki</th>
                  <th><i className="pc-dot" style={{ background: "#e2231a" }} />Rusak permanen</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const row = state[item.id];

                  return (
                    <tr key={item.id} className={row.checked ? "is-on" : undefined}>
                      <td>
                        <Form.Check
                          className="pc-check-wrap"
                          checked={row.checked}
                          onChange={() => toggleCheck(item.id)}
                          disabled={submitting}
                          aria-label={`Pilih ${item.namaBarang}`}
                          style={{ margin: 0 }}
                        />
                      </td>
                      <td>
                        <div className="fw-semibold" style={{ color: "#06355f" }}>{item.namaBarang}</div>
                        <div className="text-secondary small">{item.kodeBarang}</div>
                      </td>
                      <td className="fw-semibold">{item.jumlah}</td>
                      <td>
                        {row.checked ? (
                          <>
                            <Form.Select
                              size="sm"
                              value={row.jumlahDikembalikan}
                              onChange={(e) => handleDikembalikanChange(item.id, Number(e.target.value))}
                              disabled={submitting}
                            >
                              {Array.from({ length: item.jumlah }, (_, i) => i + 1).map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </Form.Select>
                            {row.jumlahDikembalikan < item.jumlah && (
                              <div className="pc-hint">
                                {item.jumlah - row.jumlahDikembalikan} tetap dipinjam
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td>
                        {row.checked ? (
                          <>
                            <Form.Select
                              size="sm"
                              value={row.jumlahBisaDiperbaiki}
                              onChange={(e) =>
                                updateField(item.id, "jumlahBisaDiperbaiki", Number(e.target.value))
                              }
                              disabled={submitting}
                              className={row.jumlahBisaDiperbaiki > 0 ? "mb-1" : ""}
                            >
                              {Array.from(
                                { length: row.jumlahDikembalikan - row.jumlahRusakPermanen + 1 },
                                (_, i) => i
                              ).map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </Form.Select>
                            {row.jumlahBisaDiperbaiki > 0 && (
                              <Form.Control
                                size="sm"
                                placeholder="Catatan kerusakan..."
                                value={row.catatanBisaDiperbaiki}
                                onChange={(e) => updateField(item.id, "catatanBisaDiperbaiki", e.target.value)}
                                disabled={submitting}
                              />
                            )}
                          </>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td>
                        {row.checked ? (
                          <>
                            <Form.Select
                              size="sm"
                              value={row.jumlahRusakPermanen}
                              onChange={(e) =>
                                updateField(item.id, "jumlahRusakPermanen", Number(e.target.value))
                              }
                              disabled={submitting}
                              className={row.jumlahRusakPermanen > 0 ? "mb-1" : ""}
                            >
                              {Array.from(
                                { length: row.jumlahDikembalikan - row.jumlahBisaDiperbaiki + 1 },
                                (_, i) => i
                              ).map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </Form.Select>
                            {row.jumlahRusakPermanen > 0 && (
                              <Form.Control
                                size="sm"
                                placeholder="Catatan kerusakan..."
                                value={row.catatanRusakPermanen}
                                onChange={(e) => updateField(item.id, "catatanRusakPermanen", e.target.value)}
                                disabled={submitting}
                              />
                            )}
                          </>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <div className="pc-foot">
              <span className={`pc-chip ${jumlahDicentang > 0 ? "on" : ""}`}>
                {jumlahDicentang} alat dipilih untuk dikembalikan
              </span>
              <Button
                className="pc-go"
                onClick={handleSubmit}
                disabled={submitting || jumlahDicentang === 0}
              >
                {submitting ? "Memproses..." : "Konfirmasi pengembalian"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PengembalianChecklist;