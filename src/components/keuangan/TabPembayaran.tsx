import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Download, ChevronLeft, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { getCredits, getTransactions } from "@/lib/api/keuangan";

export interface RiwayatPembayaran {
  id: string;
  tanggal: string;
  noInvoice: string;
  anak: string;
  wali: string;
  status:
    | "Pemasukan"
    | "Ke periode berikutnya"
    | "Pengembalian dana"
    | "Dikembalikan"
    | "Periode selanjutnya";
  metode: "Transfer bank" | "Tunai" | "QRIS" | "-";
  status: "Pemasukan" | "Ke periode berikutnya" | "Pengembalian dana";
  metode: string;
  bukti: string;
  jumlah: number;
}

const DUMMY_RIWAYAT: RiwayatPembayaran[] = [
  {
    id: "1",
    tanggal: "29 Sep 2026",
    noInvoice: "INV/2026/PKT/0005",
    anak: "Zahra",
    wali: "Ibu Siti Nurhaliza",
    status: "Pemasukan",
    metode: "Transfer bank",
    bukti: "-",
    jumlah: 9600000,
  },
  {
    id: "2",
    tanggal: "29 Sep 2026",
    noInvoice: "INV/2026/08/0007",
    anak: "Kenzo",
    wali: "Ibu Rina Wulandari",
    status: "Periode selanjutnya",
    metode: "-",
    bukti: "-",
    jumlah: 300000,
  },
  {
    id: "3",
    tanggal: "28 Sep 2026",
    noInvoice: "INV/2026/08/0001",
    anak: "Alya",
    wali: "Bpk. Andi Pratama",
    status: "Dikembalikan",
    metode: "Transfer bank",
    bukti: "bukti_transfer.jpg",
    jumlah: 150000,
  },
  {
    id: "4",
    tanggal: "28 Sep 2026",
    noInvoice: "INV/2026/08/0002",
    anak: "Raka",
    wali: "Bpk. Andi Pratama",
    status: "Periode selanjutnya",
    metode: "-",
    bukti: "-",
    jumlah: 175000,
  },
  {
    id: "5",
    tanggal: "28 Sep 2026",
    noInvoice: "INV/2026/09/0003",
    anak: "Zahra",
    wali: "Ibu Siti Nurhaliza",
    status: "Pemasukan",
    metode: "QRIS",
    bukti: "-",
    jumlah: 1600000,
  },
];
for (let i = 0; i < 15; i++) {
  DUMMY_RIWAYAT.push({
    id: `dummy-${i + 6}`,
    tanggal: "25 Sep 2026",
    noInvoice: `INV/2026/09/001${i}`,
    anak: "Dummy Anak " + i,
    wali: "Dummy Wali " + i,
    status: "Pemasukan",
    metode: "QRIS",
    bukti: "-",
    jumlah: 1200000,
  });
}
export interface PotonganData {
  id: string;
  anak: string;
  wali: string;
  jumlah: number;
  child_id?: string;
  guardian_id?: string;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TabPembayaran({
  data,
  riwayatList,
  data: propData,
  onBuatTagihan,
}: {
  data: PotonganData[];
  riwayatList?: RiwayatPembayaran[];
  onBuatTagihan: (anak: string, wali: string) => void;
  data?: PotonganData[];
  onBuatTagihan: (anak: string, wali: string, childId?: string, guardianId?: string) => void;
}) {
  const [credits, setCredits] = useState<PotonganData[]>(propData || []);
  const [search, setSearch] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const activeList = riwayatList ?? DUMMY_RIWAYAT;
  const currentYear = new Date().getFullYear();
  const [riwayatSearch, setRiwayatSearch] = useState("");
  const [filterMetode, setFilterMetode] = useState("Semua metode");
  const [filterBulan, setFilterBulan] = useState("Semua bulan");
  const [filterTahun, setFilterTahun] = useState(`Tahun ${currentYear}`);
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [transactions, setTransactions] = useState<RiwayatPembayaran[]>([]);
  const [trxMeta, setTrxMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summaryData, setSummaryData] = useState({ total_pemasukan: 0, total_pengembalian: 0, jumlah_transaksi: 0 });

  const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const YEARS = Array.from(new Set([
    currentYear,
    ...activeList.map(item => {
      const match = item.tanggal.match(/\d{4}/);
      return match ? parseInt(match[0], 10) : currentYear;
    })
  ])).sort((a, b) => b - a);
  const YEARS = [currentYear, currentYear - 1, currentYear - 2];

  // Fetch Credits
  const fetchCreditsData = async () => {
    const res = await getCredits();
    if (res && res.items) {
      setCredits(res.items.map((i: any) => ({
        id: i.id,
        anak: i.anak,
        wali: i.wali,
        jumlah: i.jumlah,
        child_id: i.child_id,
        guardian_id: i.guardian_id,
      })));
    }
  };

  // Fetch Transactions
  const fetchTransactionsData = async () => {
    const res = await getTransactions({
      metode: filterMetode,
      tahun: filterTahun,
      bulan: filterBulan,
      search: riwayatSearch,
      page: riwayatPage,
      per_page: itemsPerPage,
    });

    if (res) {
      if (res.summary) {
        setSummaryData(res.summary);
      }
      if (res.transactions) {
        const mapped = (res.transactions.data || []).map((t: any) => ({
          id: t.id,
          tanggal: t.payment_date ? new Date(t.payment_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : t.created_at,
          noInvoice: t.invoice?.no_invoice || "—",
          anak: t.child?.child_name || "—",
          wali: t.guardian?.guardian_name || "—",
          status: t.transaction_type,
          metode: t.payment_method,
          bukti: t.proof_file_path || "-",
          jumlah: parseFloat(t.amount || 0),
        }));
        setTransactions(mapped);
        setTrxMeta({
          current_page: res.transactions.current_page || 1,
          last_page: res.transactions.last_page || 1,
          total: res.transactions.total || 0,
        });
      }
    }
  };

  useEffect(() => {
    fetchCreditsData();
  }, []);

  useEffect(() => {
    fetchTransactionsData();
  }, [filterMetode, filterTahun, filterBulan, riwayatSearch, riwayatPage, itemsPerPage]);

  const filteredCredits = credits.filter(
    (p) =>
      p.anak.toLowerCase().includes(search.toLowerCase()) ||
      p.wali.toLowerCase().includes(search.toLowerCase())
  );

  const totalPotongan = credits.reduce((acc, curr) => acc + curr.jumlah, 0);
  const countAnak = credits.length;

  const displayedItems = isExpanded ? filteredCredits : filteredCredits.slice(0, 3);

  return (
    <div className="space-y-6">
      <motion.div
        key="pembayaran"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] p-6 sm:p-8"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-[#1E5C58] font-extrabold text-lg mb-1">
            Potongan Untuk Tagihan Berikutnya
          </h2>
          <p className="text-xs font-medium text-gray-400">
            Sisa sesi yang sudah dibayar tapi tidak terpakai. Bisa dipakai sebagai potongan di tagihan baru anak tersebut.
          </p>
        </div>

        {/* Filter & Title */}
        <div className="flex flex-col justify-between gap-4 mb-4 sm:flex-row sm:items-center">
          <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF4F3] rounded-full text-[#1E5C58] text-[11px] font-extrabold">
            <span>{countAnak} anak</span>
            <span className="text-teal-900">&bull;</span>
            <span>{formatRupiah(totalPotongan)}</span>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari anak / wali"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 text-sm text-gray-700 transition-all bg-white border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
            />
          </div>
        </div>

        {/* List */}
        <div className={`space-y-0 overflow-y-auto [scrollbar-gutter:stable] pr-2 ${isExpanded ? "max-h-[350px]" : ""}`}>
          <AnimatePresence initial={false}>
            {displayedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ opacity: { duration: 0.2, delay: 0.05 }, height: { type: "spring", bounce: 0, duration: 0.5 } }}
                className="overflow-hidden"
              >
                <div className="flex flex-col justify-between gap-4 py-4 transition-colors border-b sm:flex-row sm:items-center border-gray-100/80 hover:bg-gray-50/50 group">
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-sm font-extrabold text-gray-800">{item.anak}</span>
                    <span className="inline-flex rounded-md border border-orange-200 bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-extrabold text-orange-600">
                      Wali: {item.wali}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full gap-6 sm:justify-end sm:w-auto">
                    <span className="text-sm font-extrabold text-right text-gray-800 w-28">
                      {formatRupiah(item.jumlah)}
                    </span>
                    <button
                      onClick={() => onBuatTagihan(item.anak, item.wali, item.child_id, item.guardian_id)}
                      className="cursor-pointer px-4 py-2 bg-[#1E5C58] text-white rounded-xl text-xs font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors whitespace-nowrap"
                    >
                      Buat tagihan
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredCredits.length === 0 && (
            <div className="py-8 text-sm font-semibold text-center text-gray-400">
              Tidak ada data potongan ditemukan.
            </div>
          )}
        </div>

        {/* Lihat Semua Button (Bottom) */}
        {filteredCredits.length > 3 && (
          <div className="pt-3 mt-2 text-center border-t border-gray-100/80 -mb-2 sm:-mb-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-extrabold text-[#1E5C58] bg-teal-50 hover:bg-teal-100/80 rounded-xl transition-colors cursor-pointer"
            >
              {isExpanded ? "Tutup sebagian" : `Lihat semua (${filteredCredits.length})`}
            </button>
          </div>
        )}
      </motion.div>

      {/* --- KARTU RIWAYAT PEMBAYARAN --- */}
      <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] p-6 sm:p-8 flex flex-col">
        {/* Header Filters */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari anak, wali, atau no. invoice"
              value={riwayatSearch}
              onChange={(e) => {
                setRiwayatSearch(e.target.value);
                setRiwayatPage(1);
              }}
              className="w-full py-2.5 pl-10 pr-4 text-sm text-gray-700 transition-all bg-white border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={filterMetode}
                onChange={(e) => { setFilterMetode(e.target.value); setRiwayatPage(1); }}
                className="pl-4 pr-10 py-2.5 bg-white border border-teal-100 rounded-xl text-sm text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] appearance-none cursor-pointer"
              >
                <option>Semua metode</option>
                <option>Transfer bank</option>
                <option>Tunai</option>
                <option>QRIS</option>
              </select>
              <ChevronDown size={14} className="absolute text-teal-600 -translate-y-1/2 right-3 top-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterBulan}
                onChange={(e) => { setFilterBulan(e.target.value); setRiwayatPage(1); }}
                className="pl-4 pr-10 py-2.5 bg-white border border-teal-100 rounded-xl text-sm text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] appearance-none cursor-pointer"
              >
                <option>Semua bulan</option>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
              <ChevronDown size={14} className="absolute text-teal-600 -translate-y-1/2 right-3 top-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterTahun}
                onChange={(e) => { setFilterTahun(e.target.value); setRiwayatPage(1); }}
                className="pl-4 pr-10 py-2.5 bg-white border border-teal-100 rounded-xl text-sm text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] appearance-none cursor-pointer"
              >
                <option>Semua tahun</option>
                {YEARS.map(y => <option key={y}>Tahun {y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute text-teal-600 -translate-y-1/2 right-3 top-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tabel */}
        <div className="flex-1 overflow-x-auto min-h-[300px]">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-4 pr-4 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase">Tanggal</th>
                <th className="py-4 px-4 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase">No. Invoice</th>
                <th className="py-4 px-4 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase">Anak</th>
                <th className="py-4 px-4 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase">Status</th>
                <th className="py-4 px-4 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase">Metode</th>
                <th className="py-4 px-4 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase">Bukti</th>
                <th className="py-4 pl-4 text-[10px] font-extrabold tracking-wider text-right text-teal-800 uppercase">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Filtering
                let filteredData = activeList.filter(item => {
                  const matchSearch = item.anak.toLowerCase().includes(riwayatSearch.toLowerCase()) || 
                                      item.wali.toLowerCase().includes(riwayatSearch.toLowerCase()) || 
                                      item.noInvoice.toLowerCase().includes(riwayatSearch.toLowerCase());
                  const matchMetode = filterMetode === "Semua metode" || item.metode === filterMetode;
                  const matchBulan = filterBulan === "Semua bulan" || item.tanggal.toLowerCase().includes(filterBulan.substring(0,3).toLowerCase());
                  const matchTahun = filterTahun === "Semua tahun" || item.tanggal.includes(filterTahun.replace("Tahun ", ""));
                  return matchSearch && matchMetode && matchBulan && matchTahun;
                });

                // Pagination
                const totalData = filteredData.length;
                const startIndex = (riwayatPage - 1) * itemsPerPage;
                const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

                return currentData.map((row) => (
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm font-semibold text-gray-400">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                transactions.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 whitespace-nowrap">
                        <Calendar size={14} className="text-gray-400" />
                        {row.tanggal}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-500 whitespace-nowrap">
                      {row.noInvoice}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-extrabold text-[#1E5C58] mb-0.5 whitespace-nowrap">{row.anak}</p>
                      <span className="inline-flex rounded-md border border-orange-200 bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-extrabold text-orange-600 whitespace-nowrap">
                        Wali: {row.wali}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(row.status === "Pemasukan" || (row.status as any) === "Lunas") && (
                        <span className="inline-flex px-3 py-1 bg-teal-50 text-teal-700 text-xs font-extrabold rounded-lg">
                          Pemasukan
                        </span>
                      )}
                      {(row.status === "Ke periode berikutnya" || row.status === "Periode selanjutnya") && (
                        <span className="inline-flex px-3 py-1 bg-[#FFF7ED] text-orange-600 text-xs font-extrabold rounded-lg">
                          Periode selanjutnya
                        </span>
                      )}
                      {(row.status === "Pengembalian dana" || row.status === "Dikembalikan") && (
                        <span className="inline-flex px-3 py-1 bg-red-50 text-red-600 text-xs font-extrabold rounded-lg">
                          Dikembalikan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {row.metode}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {row.bukti !== "-" ? (
                        <a
                          href={`${process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage"}/${row.bukti}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                        >
                          <FileText size={14} />
                          Lihat Bukti
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right whitespace-nowrap">
                      {(row.status === "Pemasukan" || (row.status as any) === "Lunas") && (
                        <span className="text-sm font-extrabold text-teal-600">+ {formatRupiah(row.jumlah)}</span>
                      )}
                      {(row.status === "Ke periode berikutnya" || row.status === "Periode selanjutnya") && (
                        <span className="text-sm font-extrabold text-orange-600">{formatRupiah(row.jumlah)}</span>
                      )}
                      {(row.status === "Pengembalian dana" || row.status === "Dikembalikan") && (
                        <span className="text-sm font-extrabold text-red-500">- {formatRupiah(row.jumlah)}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Wrapper */}
        <div className="flex flex-col gap-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] text-gray-500 font-semibold">
              <span>Tampilkan</span>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setRiwayatPage(1); }}
                  className="pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] appearance-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <ChevronDown size={14} className="absolute text-gray-400 -translate-y-1/2 right-2 top-1/2 pointer-events-none" />
              </div>
              <span>data</span>
            </div>

            <div className="flex items-center gap-4">
              {(() => {
                let filteredData = activeList.filter(item => {
                  const matchSearch = item.anak.toLowerCase().includes(riwayatSearch.toLowerCase()) || 
                                      item.wali.toLowerCase().includes(riwayatSearch.toLowerCase()) || 
                                      item.noInvoice.toLowerCase().includes(riwayatSearch.toLowerCase());
                  const matchMetode = filterMetode === "Semua metode" || item.metode === filterMetode;
                  const matchBulan = filterBulan === "Semua bulan" || item.tanggal.toLowerCase().includes(filterBulan.substring(0,3).toLowerCase());
                  const matchTahun = filterTahun === "Semua tahun" || item.tanggal.includes(filterTahun.replace("Tahun ", ""));
                  return matchSearch && matchMetode && matchBulan && matchTahun;
                });
                const totalData = filteredData.length;
                const totalPages = Math.ceil(totalData / itemsPerPage) || 1;
                const startIndex = (riwayatPage - 1) * itemsPerPage;
                const endIndex = Math.min(startIndex + itemsPerPage, totalData);
                
                return (
                  <>
                    <span className="text-[13px] text-gray-500 font-medium hidden sm:inline-block">
                      Menampilkan <span className="font-extrabold text-[#1E5C58]">{totalData === 0 ? 0 : startIndex + 1} - {endIndex}</span> dari <span className="font-extrabold text-[#1E5C58]">{totalData}</span> data
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRiwayatPage(p => Math.max(1, p - 1))}
                        disabled={riwayatPage === 1}
                        className="px-2.5 py-1.5 text-[13px] font-bold border border-gray-200 rounded-lg text-gray-400 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Prev
                      </button>
                      <div className="px-3.5 py-1.5 text-[13px] font-bold text-white bg-[#2B7A75] rounded-lg shadow-sm">
                        {riwayatPage} / {totalPages}
                      </div>
                      <button
                        onClick={() => setRiwayatPage(p => Math.min(totalPages, p + 1))}
                        disabled={riwayatPage === totalPages}
                        className="px-2.5 py-1.5 text-[13px] font-bold border border-gray-200 rounded-lg text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </>
                );
              })()}
              <span className="text-[13px] text-gray-500 font-medium hidden sm:inline-block">
                Halaman <span className="font-extrabold text-[#1E5C58]">{trxMeta.current_page}</span> dari <span className="font-extrabold text-[#1E5C58]">{trxMeta.last_page}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRiwayatPage(p => Math.max(1, p - 1))}
                  disabled={riwayatPage === 1}
                  className="px-2.5 py-1.5 text-[13px] font-bold border border-gray-200 rounded-lg text-gray-400 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Prev
                </button>
                <div className="px-3.5 py-1.5 text-[13px] font-bold text-white bg-[#2B7A75] rounded-lg shadow-sm">
                  {trxMeta.current_page} / {trxMeta.last_page}
                </div>
                <button
                  onClick={() => setRiwayatPage(p => Math.min(trxMeta.last_page, p + 1))}
                  disabled={riwayatPage === trxMeta.last_page}
                  className="px-2.5 py-1.5 text-[13px] font-bold border border-gray-200 rounded-lg text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Footer Summary */}
          <div className="bg-[#EAF4F3] rounded-2xl p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 items-start sm:items-center justify-between gap-6 mt-2">
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1">Jumlah Transaksi</p>
              <p className="text-xl font-extrabold text-[#1E5C58]">
                {activeList.length}
                {summaryData.jumlah_transaksi}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1">Total Pemasukan</p>
              <p className="text-xl font-extrabold text-[#1E5C58]">
                {formatRupiah(activeList.filter(x => x.status === "Pemasukan" || (x.status as any) === "Lunas").reduce((acc, curr) => acc + curr.jumlah, 0))}
                {formatRupiah(summaryData.total_pemasukan)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1">Pengembalian Dana</p>
              <p className="text-xl font-extrabold text-[#1E5C58]">
                {formatRupiah(activeList.filter(x => x.status === "Pengembalian dana" || x.status === "Dikembalikan").reduce((acc, curr) => acc + curr.jumlah, 0))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1">Periode Selanjutnya</p>
              <p className="text-xl font-extrabold text-[#1E5C58]">
                {formatRupiah(activeList.filter(x => x.status === "Ke periode berikutnya" || x.status === "Periode selanjutnya").reduce((acc, curr) => acc + curr.jumlah, 0))}
                {formatRupiah(summaryData.total_pengembalian)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
