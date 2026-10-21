import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Download, ChevronLeft, ChevronRight, ChevronDown, FileText } from "lucide-react";


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
  onBuatTagihan,
}: {
  data: PotonganData[];
  riwayatList?: RiwayatPembayaran[];
  onBuatTagihan: (anak: string, wali: string) => void;
}) {
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

  const filtered = data.filter(
    (p) =>
      p.anak.toLowerCase().includes(search.toLowerCase()) ||
      p.wali.toLowerCase().includes(search.toLowerCase())
  );

  const totalPotongan = data.reduce((acc, curr) => acc + curr.jumlah, 0);
  const countAnak = data.length;

  // Show only 3 items initially, unless expanded
  const displayedItems = isExpanded ? filtered : filtered.slice(0, 3);

  return (
    <div className="space-y-6">
    <motion.div
      key="pembayaran"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] p-4 sm:p-6"
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-[#1E5C58] font-extrabold text-base mb-0.5">
          Potongan Untuk Tagihan Berikutnya
        </h2>
        <p className="text-[11px] font-medium text-gray-400">
          Sisa sesi yang sudah dibayar tapi tidak terpakai. Bisa dipakai sebagai potongan di tagihan baru anak tersebut.
        </p>
      </div>

      {/* Filter & Title */}
      <div className="flex flex-col justify-between gap-3 mb-3 sm:flex-row sm:items-center">
        <div className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EAF4F3] rounded-full text-[#1E5C58] text-[10px] font-extrabold">
          <span>{countAnak} anak</span>
          <span className="text-teal-900">&bull;</span>
          <span>{formatRupiah(totalPotongan)}</span>
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari anak / wali"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-1.5 pl-9 pr-3 text-xs text-gray-700 transition-all bg-white border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
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
              <div className="flex flex-col justify-between gap-3 py-2.5 transition-colors border-b sm:flex-row sm:items-center border-gray-100/80 hover:bg-gray-50/50 group">
                <div className="flex items-center gap-2.5">
                  <span className="w-24 text-xs font-bold text-gray-800">{item.anak}</span>
                  <span className="inline-flex rounded-md border border-orange-200 bg-[#FFF7ED] px-1.5 py-0.5 text-[9px] font-extrabold text-orange-600">
                    Wali: {item.wali}
                  </span>
                </div>
                <div className="flex items-center justify-between w-full gap-4 sm:justify-end sm:w-auto">
                  <span className="text-xs font-bold text-right text-gray-800 w-24">
                    {formatRupiah(item.jumlah)}
                  </span>
                  <button
                    onClick={() => onBuatTagihan(item.anak, item.wali)}
                    className="cursor-pointer px-3 py-1.5 bg-[#1E5C58] text-white rounded-xl text-[11px] font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors whitespace-nowrap"
                  >
                    Buat tagihan
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-6 text-xs font-semibold text-center text-gray-400">
            Tidak ada data potongan ditemukan.
          </div>
        )}
      </div>

      {/* Lihat Semua Button (Bottom) */}
      {filtered.length > 3 && (
        <div className="pt-2.5 mt-2 text-center border-t border-gray-100/80 -mb-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold text-[#1E5C58] bg-teal-50 hover:bg-teal-100/80 rounded-xl transition-colors cursor-pointer"
          >
            {isExpanded ? "Tutup sebagian" : `Lihat semua (${filtered.length})`}
          </button>
        </div>
      )}
    </motion.div>


      {/* --- KARTU RIWAYAT PEMBAYARAN --- */}
      <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] p-4 sm:p-6 flex flex-col">
        {/* Header Filters */}
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari anak, wali, atau no. invoice"
              value={riwayatSearch}
              onChange={(e) => {
                setRiwayatSearch(e.target.value);
                setRiwayatPage(1);
              }}
              className="w-full py-1.5 pl-8 pr-3 text-xs text-gray-700 transition-all bg-white border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={filterMetode}
                onChange={(e) => { setFilterMetode(e.target.value); setRiwayatPage(1); }}
                className="pl-3 pr-7 py-1.5 bg-white border border-teal-100 rounded-xl text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] appearance-none cursor-pointer"
              >
                <option>Semua metode</option>
                <option>Transfer bank</option>
                <option>Tunai</option>
                <option>QRIS</option>
              </select>
              <ChevronDown size={12} className="absolute text-teal-600 -translate-y-1/2 right-2.5 top-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterBulan}
                onChange={(e) => { setFilterBulan(e.target.value); setRiwayatPage(1); }}
                className="pl-3 pr-7 py-1.5 bg-white border border-teal-100 rounded-xl text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] appearance-none cursor-pointer"
              >
                <option>Semua bulan</option>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
              <ChevronDown size={12} className="absolute text-teal-600 -translate-y-1/2 right-2.5 top-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterTahun}
                onChange={(e) => { setFilterTahun(e.target.value); setRiwayatPage(1); }}
                className="pl-3 pr-7 py-1.5 bg-white border border-teal-100 rounded-xl text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] appearance-none cursor-pointer"
              >
                <option>Semua tahun</option>
                {YEARS.map(y => <option key={y}>Tahun {y}</option>)}
              </select>
              <ChevronDown size={12} className="absolute text-teal-600 -translate-y-1/2 right-2.5 top-1/2 pointer-events-none" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1E5C58] bg-white border border-[#1E5C58] rounded-xl hover:bg-teal-50 transition-colors">
              <Download size={13} />
              Export
            </button>
          </div>
        </div>

        {/* Tabel */}
        <div className="flex-1 overflow-x-auto no-scrollbar min-h-[350px]">
          <table className="w-full text-xs text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-2.5 pr-2.5 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase w-[13%]">Tanggal</th>
                <th className="py-2.5 px-2.5 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase w-[16%]">No. Invoice</th>
                <th className="py-2.5 px-2.5 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase w-[22%]">Anak</th>
                <th className="py-2.5 px-2.5 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase w-[15%]">Status</th>
                <th className="py-2.5 px-2.5 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase w-[11%]">Metode</th>
                <th className="py-2.5 px-2.5 text-[10px] font-extrabold tracking-wider text-teal-800 uppercase w-[11%]">Bukti</th>
                <th className="py-2.5 pl-2.5 text-[10px] font-extrabold tracking-wider text-right text-teal-800 uppercase w-[12%]">Jumlah</th>
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
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 pr-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 whitespace-nowrap">
                        <Calendar size={13} className="text-gray-400" />
                        {row.tanggal}
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 text-xs font-semibold text-gray-600 truncate">
                      {row.noInvoice}
                    </td>
                    <td className="px-2.5 py-2.5">
                      <p className="text-xs font-bold text-[#1E5C58] mb-0.5 truncate">{row.anak}</p>
                      <span className="inline-flex rounded-md border border-orange-200 bg-[#FFF7ED] px-1.5 py-0.2 text-[9px] font-extrabold text-orange-600 truncate">
                        Wali: {row.wali}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      {(row.status === "Pemasukan" || (row.status as any) === "Lunas") && (
                        <span className="inline-flex px-2 py-0.5 bg-teal-50 text-teal-700 text-[11px] font-extrabold rounded-md">
                          Pemasukan
                        </span>
                      )}
                      {(row.status === "Ke periode berikutnya" || row.status === "Periode selanjutnya") && (
                        <span className="inline-flex px-2 py-0.5 bg-[#FFF7ED] text-orange-600 text-[11px] font-extrabold rounded-md">
                          Periode selanjutnya
                        </span>
                      )}
                      {(row.status === "Pengembalian dana" || row.status === "Dikembalikan") && (
                        <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-600 text-[11px] font-extrabold rounded-md">
                          Dikembalikan
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">
                      {row.metode}
                    </td>
                    <td className="px-2.5 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {row.bukti !== "-" ? (
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold hover:bg-blue-100 transition-colors">
                          <FileText size={12} />
                          Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-2.5 text-right whitespace-nowrap text-xs font-extrabold">
                      {(row.status === "Pemasukan" || (row.status as any) === "Lunas") && (
                        <span className="text-teal-600">+ {formatRupiah(row.jumlah)}</span>
                      )}
                      {(row.status === "Ke periode berikutnya" || row.status === "Periode selanjutnya") && (
                        <span className="text-orange-600">{formatRupiah(row.jumlah)}</span>
                      )}
                      {(row.status === "Pengembalian dana" || row.status === "Dikembalikan") && (
                        <span className="text-red-500">- {formatRupiah(row.jumlah)}</span>
                      )}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Wrapper */}
        <div className="flex flex-col gap-4 mt-4">
          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
              <span>Tampilkan</span>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setRiwayatPage(1); }}
                  className="pl-2.5 pr-6 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] appearance-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <ChevronDown size={12} className="absolute text-gray-400 -translate-y-1/2 right-1.5 top-1/2 pointer-events-none" />
              </div>
              <span>data</span>
            </div>

            <div className="flex items-center gap-3">
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
                    <span className="text-xs text-gray-500 font-medium hidden sm:inline-block">
                      Menampilkan <span className="font-extrabold text-[#1E5C58]">{totalData === 0 ? 0 : startIndex + 1} - {endIndex}</span> dari <span className="font-extrabold text-[#1E5C58]">{totalData}</span> data
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRiwayatPage(p => Math.max(1, p - 1))}
                        disabled={riwayatPage === 1}
                        className="px-2 py-1 text-xs font-bold border border-gray-200 rounded-lg text-gray-400 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Prev
                      </button>
                      <div className="px-2.5 py-1 text-xs font-bold text-white bg-[#2B7A75] rounded-lg shadow-sm">
                        {riwayatPage} / {totalPages}
                      </div>
                      <button
                        onClick={() => setRiwayatPage(p => Math.min(totalPages, p + 1))}
                        disabled={riwayatPage === totalPages}
                        className="px-2 py-1 text-xs font-bold border border-gray-200 rounded-lg text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Footer Summary */}
          <div className="bg-[#EAF4F3] rounded-2xl p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 items-start sm:items-center justify-between gap-4 mt-1">
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-0.5">Jumlah Transaksi</p>
              <p className="text-base sm:text-lg font-extrabold text-[#1E5C58]">
                {activeList.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-0.5">Total Pemasukan</p>
              <p className="text-base sm:text-lg font-extrabold text-[#1E5C58]">
                {formatRupiah(activeList.filter(x => x.status === "Pemasukan" || (x.status as any) === "Lunas").reduce((acc, curr) => acc + curr.jumlah, 0))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-0.5">Pengembalian Dana</p>
              <p className="text-base sm:text-lg font-extrabold text-[#1E5C58]">
                {formatRupiah(activeList.filter(x => x.status === "Pengembalian dana" || x.status === "Dikembalikan").reduce((acc, curr) => acc + curr.jumlah, 0))}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-0.5">Periode Selanjutnya</p>
              <p className="text-base sm:text-lg font-extrabold text-[#1E5C58]">
                {formatRupiah(activeList.filter(x => x.status === "Ke periode berikutnya" || x.status === "Periode selanjutnya").reduce((acc, curr) => acc + curr.jumlah, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


