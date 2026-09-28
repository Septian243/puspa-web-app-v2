"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";

export type PresensiDetailStatus =
    | "Belum Presensi"
    | "Sakit"
    | "Hadir"
    | "Izin"
    | "Tidak Hadir";

export interface PresensiDetailData {
    id: string;
    pasienName: string;
    waliName: string;
    tanggal: string;
    waktu: string;
    terapisName: string;
    tipeTermi: string;
    status: PresensiDetailStatus;
    keterangan: string;
    reschedule?: {
        tanggal: string;
        waktu: string;
    };
}

function StatusBadge({ status }: { status: PresensiDetailStatus }) {
    const styles: Record<PresensiDetailStatus, string> = {
        "Belum Presensi": "bg-gray-100 text-gray-400 border-gray-200",
        Sakit: "bg-blue-50 text-blue-500 border-blue-200",
        Hadir: "bg-green-50 text-emerald-600 border-green-200",
        Izin: "bg-amber-50 text-amber-600 border-amber-200",
        "Tidak Hadir": "bg-red-50 text-red-600 border-red-200",
    };

    return (
        <span className={`inline-flex items-center justify-center px-3 py-1 text-[11px] font-extrabold rounded-full border ${styles[status]}`}>
            {status}
        </span>
    );
}

export default function FormDetailPresensi({
    item,
    onCloseAction,
}: {
    item: PresensiDetailData;
    onCloseAction: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1E5C58]/20 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between bg-[#1E5C58] px-5 py-4 text-white">
                    <div>
                        <h2 className="text-base font-bold">Detail Presensi</h2>
                        <p className="mt-0.5 text-xs font-medium text-white/75">
                            {item.pasienName} • {item.tanggal}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCloseAction}
                        className="cursor-pointer rounded-full bg-white/10 p-1.5 text-white/75 transition-colors hover:bg-white/20 hover:text-white"
                        aria-label="Tutup detail presensi"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm">
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400">Nama Anak</p>
                        <p className="mt-1 font-bold text-gray-700">{item.pasienName}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400">Wali</p>
                        <p className="mt-1 font-bold text-gray-700">{item.waliName}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400">Terapis</p>
                        <p className="mt-1 font-bold text-gray-700">{item.terapisName}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400">Tipe Terapi</p>
                        <p className="mt-1 font-bold text-gray-700">{item.tipeTermi}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400">Jadwal</p>
                        <p className="mt-1 font-bold text-gray-700">
                            {item.tanggal}, {item.waktu}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400">Status</p>
                        <div className="mt-1">
                            <StatusBadge status={item.status} />
                        </div>
                    </div>
                    <div className="col-span-2 border-t border-gray-100 pt-4">
                        <p className="text-[11px] font-semibold text-gray-400">Keterangan</p>
                        <p className="mt-1 font-medium leading-relaxed text-gray-600">
                            {item.keterangan || "-"}
                        </p>
                    </div>
                    {item.reschedule && (
                        <div className="col-span-2 rounded-xl border border-teal-100 bg-teal-50/50 p-3">
                            <p className="text-[11px] font-semibold text-[#2B7A75]">Jadwal Reschedule</p>
                            <p className="mt-1 font-bold text-[#1E5C58]">
                                {item.reschedule.tanggal}, {item.reschedule.waktu}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-100 px-5 py-3">
                    <button
                        type="button"
                        onClick={onCloseAction}
                        className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                        Tutup
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
