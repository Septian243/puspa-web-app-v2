"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserSquare2,
  Search,
  Check,
  X,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import {
  getUnverifiedTherapists,
  activateTherapist,
  deactivateTherapist,
} from "@/lib/api/ownerTerapis";

interface TherapistData {
  user_id: string;
  therapist_id?: string;
  therapist_name: string;
  email: string;
  createdAt: string;
}

const VerifikasiTerapisPage: React.FC = () => {
  const [therapists, setTherapists] = useState<TherapistData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "reject";
    item: TherapistData;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadTherapists = async () => {
    setLoading(true);
    try {
      const response = await getUnverifiedTherapists();
      if (response.success && Array.isArray(response.data)) {
        setTherapists(response.data);
      } else {
        setTherapists([]);
      }
    } catch (err) {
      console.error(err);
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTherapists();
  }, []);

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { type, item } = actionModal;

    try {
      if (type === "approve") {
        await activateTherapist(item.user_id);
      } else {
        await deactivateTherapist(item.user_id);
      }
      await loadTherapists();
      setActionModal(null);
      showToast(
        type === "approve"
          ? `Terapis ${item.therapist_name} berhasil disetujui!`
          : `Pendaftaran terapis ${item.therapist_name} telah ditolak.`
      );
    } catch (err: any) {
      console.error("Gagal melakukan aksi verifikasi terapis:", err);
      showToast(err.message || "Gagal memproses verifikasi terapis.");
    }
  };

  const handleResetData = () => {
    loadTherapists();
    setSearch("");
    showToast("Data antrean terapis diperbarui.");
  };

  const filteredTherapists = therapists.filter(
    (item) =>
      item.therapist_name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
      <div className="flex flex-col flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-50 pb-5">
          <div>
            <h1 className="text-xl font-extrabold text-[#1E5C58]">Verifikasi Terapis</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Setujui atau tolak pendaftaran terapis baru untuk mulai menangani pasien di platform PUSPA.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#81B7A9]" />
            </div>
            <input
              type="text"
              placeholder="Cari terapis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-teal-50 rounded-xl text-sm focus:ring-2 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all placeholder-gray-450 font-medium text-gray-700 shadow-xs"
            />
          </div>
        </div>

        {/* Table/Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-transparent md:bg-white md:rounded-3xl md:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] md:border md:border-teal-50 overflow-hidden md:p-6 w-full"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl md:bg-transparent border border-teal-50 md:border-0 shadow-xs md:shadow-none">
              <div className="w-10 h-10 border-4 border-teal-100 border-t-[#2B7A75] rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-medium text-sm animate-pulse">
                Memuat berkas verifikasi...
              </p>
            </div>
          ) : filteredTherapists.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-3xl md:bg-transparent border border-teal-50 md:border-0 shadow-xs md:shadow-none">
              <div className="w-20 h-20 bg-teal-50/50 rounded-full flex items-center justify-center mb-4 border border-teal-100/30">
                <UserSquare2 className="w-10 h-10 text-[#2B7A75] opacity-50" />
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1">
                {search ? "Terapis Tidak Ditemukan" : "Tidak Ada Antrean Verifikasi"}
              </h3>
              <p className="text-gray-400 text-xs max-w-xs font-semibold leading-relaxed mb-4">
                {search
                  ? `Tidak ada hasil verifikasi terapis yang cocok dengan pencarian "${search}".`
                  : "Saat ini belum ada terapis baru yang menunggu verifikasi dari Anda."}
              </p>
              <button
                onClick={handleResetData}
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E5C58] hover:bg-[#163F3C] text-white text-xs font-bold transition-all shadow-xs"
              >
                <RotateCcw size={14} />
                Muat Ulang Data
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider w-16">
                        No
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">
                        Nama Terapis
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">
                        Email
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">
                        Tanggal Pendaftaran
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-center w-64">
                        Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTherapists.map((item, idx) => (
                      <tr
                        key={item.user_id}
                        className="border-b border-gray-55 last:border-0 hover:bg-[#F4F9F8]/50 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm font-semibold text-gray-455">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-gray-800">
                          {item.therapist_name}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-500">
                          {item.email}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-[#1E5C58]">
                          {item.createdAt}
                        </td>
                        <td className="py-4 px-6 flex items-center justify-center gap-3">
                          {/* Approve Button */}
                          <button
                            onClick={() =>
                              setActionModal({ type: "approve", item })
                            }
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 transition-all font-bold text-xs shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <Check size={14} strokeWidth={2.5} />
                            Setujui
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() =>
                              setActionModal({ type: "reject", item })
                            }
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/50 transition-all font-bold text-xs shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <X size={14} strokeWidth={2.5} />
                            Tolak
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {filteredTherapists.map((item, idx) => (
                  <div
                    key={item.user_id}
                    className="bg-white border border-teal-50 rounded-2xl p-4 space-y-3.5 shadow-xs text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{item.therapist_name}</h4>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{item.email}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#1E5C58] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100/30 shrink-0">
                        No. {idx + 1}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-teal-50/55 flex justify-between items-center text-xs">
                      <div>
                        <span className="block text-[10px] text-gray-400 uppercase font-semibold">Tgl Daftar</span>
                        <span className="font-semibold text-gray-650">{item.createdAt}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() =>
                          setActionModal({ type: "approve", item })
                        }
                        className="cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 font-bold text-xs transition-all"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        Setujui
                      </button>
                      <button
                        onClick={() =>
                          setActionModal({ type: "reject", item })
                        }
                        className="cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 font-bold text-xs transition-all"
                      >
                        <X size={14} strokeWidth={2.5} />
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Action Confirmation Modal */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-4"
            >
              <div
                className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                  actionModal.type === "approve"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {actionModal.type === "approve" ? (
                  <Check size={28} strokeWidth={2.5} />
                ) : (
                  <AlertCircle size={28} strokeWidth={2.5} />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-800">
                  {actionModal.type === "approve"
                    ? "Setujui Pendaftaran Terapis?"
                    : "Tolak Pendaftaran Terapis?"}
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 font-medium leading-relaxed">
                  {actionModal.type === "approve" ? (
                    <>
                      Apakah Anda yakin ingin menyetujui akun terapis{" "}
                      <span className="font-bold text-gray-700">
                        {actionModal.item.therapist_name}
                      </span>
                      ? Terapis akan dapat mengakses sistem dan menangani sesi terapi pasien di PUSPA.
                    </>
                  ) : (
                    <>
                      Apakah Anda yakin ingin menolak pendaftaran terapis{" "}
                      <span className="font-bold text-gray-700">
                        {actionModal.item.therapist_name}
                      </span>
                      ?
                    </>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setActionModal(null)}
                  className="cursor-pointer py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`cursor-pointer py-2.5 px-4 rounded-xl text-white font-bold text-xs transition-all shadow-xs ${
                    actionModal.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionModal.type === "approve" ? "Ya, Setujui" : "Ya, Tolak"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1E5C58] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold"
          >
            <Check size={16} className="text-[#81B7A9]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifikasiTerapisPage;
