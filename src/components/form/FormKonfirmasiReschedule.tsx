"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { PresensiManualPayload } from "./FormMulaiPresensi";

export default function FormKonfirmasiReschedule({
    payload,
    isSubmitting,
    onCancelAction,
    onConfirmAction,
}: {
    payload: PresensiManualPayload;
    isSubmitting?: boolean;
    onCancelAction: () => void;
    onConfirmAction: () => void;
}) {
    const [year, month, day] = (payload.tanggalBaru || "").split("-");

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1E5C58]/25 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-sm overflow-hidden bg-white shadow-2xl rounded-2xl"
            >
                <div className="px-5 py-4 text-white bg-[#1E5C58]">
                    <h3 className="text-base font-bold">Konfirmasi Reschedule</h3>
                    <p className="mt-1 text-xs text-white/75">Pastikan jadwal baru sudah benar.</p>
                </div>
                <div className="p-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Terapis</span>
                        <span className="font-bold text-right text-[#1E5C58]">{payload.terapisBaru}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Tanggal</span>
                        <span className="font-bold text-right text-[#1E5C58]">{day}/{month}/{year}</span>
                    </div>
                    <p className="pt-2 text-xs leading-relaxed text-gray-500 border-t border-gray-100">
                        Data presensi dan reschedule akan disimpan setelah dikonfirmasi.
                    </p>
                </div>
                <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancelAction}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Periksa Lagi
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmAction}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg cursor-pointer bg-[#1E5C58] hover:bg-[#164945] disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {isSubmitting ? "Menyimpan..." : "Ya, Simpan"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

