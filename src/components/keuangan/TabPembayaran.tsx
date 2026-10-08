import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

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
  onBuatTagihan,
}: {
  data: PotonganData[];
  onBuatTagihan: (anak: string, wali: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

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
    <motion.div
      key="pembayaran"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] p-6 sm:p-8"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 mb-8 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-[#1E5C58] font-extrabold text-lg mb-1">
            Potongan Untuk Tagihan Berikutnya
          </h2>
          <p className="text-xs font-medium text-gray-400">
            Sisa sesi yang sudah dibayar tapi tidak terpakai. Nilainya otomatis memotong tagihan baru anak tersebut.
          </p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF4F3] rounded-full text-[#1E5C58] text-[11px] font-extrabold">
          <span>{countAnak} anak</span>
          <span className="text-teal-900">•</span>
          <span>{formatRupiah(totalPotongan)}</span>
        </div>
      </div>

      {/* Filter & Title */}
      <div className="flex flex-col justify-between gap-4 mb-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="font-extrabold text-[#1E5C58] text-sm hover:text-teal-800 transition-colors cursor-pointer text-left"
        >
          {isExpanded ? "Tutup" : `Lihat semua (${countAnak})`}
        </button>
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
                    onClick={() => onBuatTagihan(item.anak, item.wali)}
                    className="cursor-pointer px-4 py-2 bg-[#1E5C58] text-white rounded-xl text-xs font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors whitespace-nowrap"
                  >
                    Buat tagihan
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-8 text-sm font-semibold text-center text-gray-400">
            Tidak ada data potongan ditemukan.
          </div>
        )}
      </div>
    </motion.div>
  );
}
