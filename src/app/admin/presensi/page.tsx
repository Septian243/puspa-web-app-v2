"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Users, CheckCircle2, Activity, Calendar, CalendarDays, Search, Clock, User, Settings, ChevronDown, Play, Pencil, Eye, Download, X, ScanLine, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FormCatatKehadiran, {
    PresensiManualInitialValues,
    PresensiManualPayload,
    PresensiManualTarget,
} from "@/components/form/FormMulaiPresensi";
import FormDetailPresensi from "@/components/form/FormDetailPresensi";

// ── Types ──────────────────────────────────────────────────────────────────────
interface PresensiData {
    id: string;
    pasienName: string;
    waliName: string;
    tanggal: string;
    waktu: string;
    terapisName: string;
    tipeTermi: string;
    status: "Belum Presensi" | "Sakit" | "Hadir" | "Izin" | "Tidak Hadir";
    keterangan: string;
    reschedule?: {
        tanggal: string;
        waktu: string;
    };
}

interface RescheduleData {
    id: string;
    pasienName: string;
    waliName: string;
    terapis: string;
    jadwalSemulaTanggal: string;
    jadwalSemulaWaktu: string;
    jadwalBaruTanggal: string;
    jadwalBaruWaktu: string;
    alasan: string;
    status: Exclude<PresensiData["status"], "Belum Presensi">;
}

// ── Dummy Data ─────────────────────────────────────────────────────────────────
const initialDummyPresensi: PresensiData[] = [
    {
        id: "1",
        pasienName: "Rayhan",
        waliName: "Devi Erna",
        tanggal: "25/09/2026",
        waktu: "Pukul 15.41 - 15.42",
        terapisName: "Alief Arifun",
        tipeTermi: "Terapi Wicara",
        status: "Belum Presensi",
        keterangan: "-",
    },
    {
        id: "2",
        pasienName: "Shofiya",
        waliName: "Fiyatiya",
        tanggal: "25/09/2026",
        waktu: "Pukul 15.27 - 15.32",
        terapisName: "Alief Arifun",
        tipeTermi: "Fisioterapi",
        status: "Belum Presensi",
        keterangan: "-",
    },
    {
        id: "3",
        pasienName: "Lutfy",
        waliName: "Zaini",
        tanggal: "25/09/2026",
        waktu: "Pukul 16.51 - 17.04",
        terapisName: "Alief Arifun",
        tipeTermi: "Terapi Okupasi",
        status: "Sakit",
        keterangan: "Demam tinggi, sudah izin dari orang tua",
    },
    {
        id: "4",
        pasienName: "Zamzam",
        waliName: "Annison Nur Qoriah",
        tanggal: "25/09/2026",
        waktu: "Pukul 11.36 - 13.33",
        terapisName: "Nindya Zahri",
        tipeTermi: "PLB (Paedagog)",
        status: "Hadir",
        keterangan: "-",
    },
    {
        id: "5",
        pasienName: "Alya",
        waliName: "Rina Maulida",
        tanggal: "25/09/2026",
        waktu: "Pukul 09.00 - 10.00",
        terapisName: "Nindya Zahri",
        tipeTermi: "Terapi Wicara",
        status: "Izin",
        keterangan: "Ada keperluan keluarga.",
        reschedule: {
            tanggal: "02/10/2026",
            waktu: "Pukul 09.30 - 10.30",
        },
    },
    {
        id: "6",
        pasienName: "Bagas",
        waliName: "Dedi Santoso",
        tanggal: "25/09/2026",
        waktu: "Pukul 10.30 - 11.30",
        terapisName: "Alief Arifun",
        tipeTermi: "Fisioterapi",
        status: "Tidak Hadir",
        keterangan: "Tidak ada konfirmasi dari wali.",
    },
];

const dummyReschedule: RescheduleData[] = [
    {
        id: "1",
        pasienName: "Lutfy",
        waliName: "Zaini",
        terapis: "Alief Arifun",
        jadwalSemulaTanggal: "30/08/2026",
        jadwalSemulaWaktu: "Pukul 16.51 - 17.04",
        jadwalBaruTanggal: "05/09/2026",
        jadwalBaruWaktu: "Pukul 16.30 - 17.00",
        alasan: "Demam tinggi, sudah izin dari orang tua",
        status: "Sakit",
    },
    {
        id: "2",
        pasienName: "Zefanya Lidia",
        waliName: "Alief Arifin M.",
        terapis: "Alief Arifun",
        jadwalSemulaTanggal: "28/05/2026",
        jadwalSemulaWaktu: "Pukul 09.35 - 10.35",
        jadwalBaruTanggal: "04/06/2026",
        jadwalBaruWaktu: "Pukul 10.00 - 11.00",
        alasan: "Orang tua berhalangan hadir, sudah konfirmasi",
        status: "Izin",
    },
    {
        id: "3",
        pasienName: "Alya",
        waliName: "Rina Maulida",
        terapis: "Nindya Zahri",
        jadwalSemulaTanggal: "02/06/2026",
        jadwalSemulaWaktu: "Pukul 09.00 - 10.00",
        jadwalBaruTanggal: "09/06/2026",
        jadwalBaruWaktu: "Pukul 09.00 - 10.00",
        alasan: "Ada keperluan keluarga",
        status: "Tidak Hadir",
    },
];

// Data untuk absensi anak yang jadwalnya sudah di-reschedule (di tab Presensi)
const initialDummyPresensiReschedule: PresensiData[] = [
    {
        id: "r1",
        pasienName: "Lutfy",
        waliName: "Zaini",
        tanggal: "30/08/2026",
        waktu: "Pukul 16.51 - 17.04",
        terapisName: "Alief Arifun",
        tipeTermi: "Terapi Okupasi",
        status: "Sakit",
        keterangan: "Demam tinggi, sudah izin dari orang tua",
        reschedule: {
            tanggal: "28/09/2026",
            waktu: "Pukul 16.30 - 17.00",
        },
    },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
// Fungsi untuk memisahkan jam dari format "Pukul 15.41 - 15.42"
function parseWaktu(waktuStr: string) {
    const match = waktuStr.match(/(\d{2}\.\d{2})/);
    return match ? match[1] : "99.99";
}

function formatTanggalDisplay(tanggal: string) {
    const [tahun, bulan, hari] = tanggal.split("-");
    return `${hari}/${bulan}/${tahun}`;
}

function formatTanggalInput(tanggal: string) {
    const [hari, bulan, tahun] = tanggal.split("/");
    return `${tahun}-${bulan}-${hari}`;
}

function tanggalRescheduleToIso(tanggal: string) {
    const [hari, bulan, tahun] = tanggal.split("/");
    return tahun && bulan && hari ? `${tahun}-${bulan}-${hari}` : "";
}

function hitungHariPergeseran(tanggalSemula: string, tanggalBaru: string) {
    const bulan: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
        Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
    };
    const [hariSemula, bulanSemula, tahunSemula] = tanggalSemula.split("/").map(Number);
    const tanggalBaruParts = tanggalBaru.includes("/")
        ? tanggalBaru.split("/")
        : tanggalBaru.split(" ");
    const [hariBaru, bulanBaru, tahunBaru] = tanggalBaruParts;
    const tanggalAwal = Date.UTC(tahunSemula, bulanSemula - 1, hariSemula);
    const bulanBaruIndex = tanggalBaru.includes("/")
        ? Number(bulanBaru) - 1
        : bulan[bulanBaru];
    const tanggalAkhir = Date.UTC(Number(tahunBaru), bulanBaruIndex, Number(hariBaru));
    return Math.round((tanggalAkhir - tanggalAwal) / 86400000);
}

function formatWaktuDisplay(jamMulai: string, jamSelesai: string) {
    return `Pukul ${jamMulai.replace(":", ".")} - ${jamSelesai.replace(":", ".")}`;
}

function formatWaktuInput(waktu: string) {
    const jam = waktu.match(/\d{2}[.:]\d{2}/g) ?? [];
    return jam.map((value) => value.replace(".", ":"));
}

// Fungsi untuk mengurutkan data presensi (Belum Presensi di atas, urut berdasarkan waktu)
function sortPresensiData(data: PresensiData[]) {
    return [...data].sort((a, b) => {
        const isABelum = a.status === "Belum Presensi";
        const isBBelum = b.status === "Belum Presensi";

        if (isABelum && !isBBelum) return -1;
        if (!isABelum && isBBelum) return 1;

        const timeA = parseWaktu(a.waktu);
        const timeB = parseWaktu(b.waktu);
        return timeA.localeCompare(timeB);
    });
}

// ── Badge Status ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PresensiData["status"] }) {
    const styles: Record<string, string> = {
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

// ── Pagination Footer ────────────────────────────────────────────────────────────
function PaginationFooter({
    totalItems,
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return (
        <div className="flex flex-col items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-100 sm:flex-row rounded-b-2xl">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Tampilkan</span>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 cursor-pointer"
                >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
                <span>data</span>
            </div>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <span className="text-sm text-gray-500">
                    Menampilkan <span className="font-bold text-[#1E5C58]">1</span> - <span className="font-bold text-[#1E5C58]">{totalItems}</span> dari <span className="font-bold text-[#1E5C58]">{totalItems}</span> data
                </span>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        disabled={currentPage <= 1}
                    >
                        Prev
                    </button>
                    <button className="px-3 py-1.5 text-xs font-bold text-white bg-[#2B7A75] border border-[#2B7A75] rounded-lg">
                        {currentPage} / {totalPages}
                    </button>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Action Dropdown ────────────────────────────────────────────────────────────
function ActionDropdown({
    item,
    openDropdownId,
    setOpenDropdownId,
    onMulai,
    onEdit,
    onDetail,
}: {
    item: PresensiData;
    openDropdownId: string | null;
    setOpenDropdownId: (id: string | null) => void;
    onMulai: (item: PresensiData) => void;
    onEdit: (item: PresensiData) => void;
    onDetail: (item: PresensiData) => void;
}) {
    const isOpen = openDropdownId === item.id;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUpward: boolean }>({
        top: 0,
        left: 0,
        openUpward: false,
    });

    const MENU_WIDTH = 192;
    const MENU_HEIGHT_ESTIMATE = 96;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpward = spaceBelow < MENU_HEIGHT_ESTIMATE + 12;

            let left = rect.right - MENU_WIDTH;
            if (left < 8) left = 8;
            if (left + MENU_WIDTH > window.innerWidth - 8) {
                left = window.innerWidth - MENU_WIDTH - 8;
            }

            setMenuPos({
                top: openUpward ? rect.top - MENU_HEIGHT_ESTIMATE - 8 : rect.bottom + 8,
                left,
                openUpward,
            });
        }

        setOpenDropdownId(isOpen ? null : item.id);
    };

    return (
        <td className="px-6 py-4 text-center">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-100 rounded-lg text-[#1E5C58] hover:bg-teal-50/40 text-xs font-semibold transition-colors"
            >
                <Settings size={14} />
                <span>Aksi</span>
                <ChevronDown size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Overlay transparan untuk deteksi klik di luar */}
                            <div
                                className="fixed inset-0 z-[100]"
                                onClick={() => setOpenDropdownId(null)}
                            />

                            <motion.div
                                initial={{ opacity: 0, y: menuPos.openUpward ? 10 : -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: menuPos.openUpward ? 10 : -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: "fixed",
                                    top: menuPos.top,
                                    left: menuPos.left,
                                    width: MENU_WIDTH,
                                }}
                                className="z-[101] rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-teal-50/80 overflow-hidden py-1 text-[#1E5C58]"
                            >
                                {item.status === "Belum Presensi" ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setOpenDropdownId(null);
                                                onMulai(item);
                                            }}
                                            className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                                        >
                                            <Play size={16} className="mr-2 text-[#81B7A9]" />
                                            Mulai
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOpenDropdownId(null);
                                                onDetail(item);
                                            }}
                                            className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                                        >
                                            <Eye size={16} className="mr-2 text-[#81B7A9]" />
                                            Detail
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setOpenDropdownId(null);
                                                onEdit(item);
                                            }}
                                            className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                                        >
                                            <Pencil size={16} className="mr-2 text-[#81B7A9]" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOpenDropdownId(null);
                                                onDetail(item);
                                            }}
                                            className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                                        >
                                            <Eye size={16} className="mr-2 text-[#81B7A9]" />
                                            Detail
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </td>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────
function MobilePresensiCard({
    item,
    onMulai,
    onEdit,
    onDetail,
}: {
    item: PresensiData;
    onMulai: (item: PresensiData) => void;
    onEdit: (item: PresensiData) => void;
    onDetail: (item: PresensiData) => void;
}) {
    const isBelumPresensi = item.status === "Belum Presensi";

    return (
        <article className="p-4 bg-white border border-teal-100 shadow-sm rounded-2xl">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-gray-800 truncate">{item.pasienName}</h4>
                    <span className="mt-1 inline-flex max-w-full truncate rounded-md border border-orange-200 bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-800">
                        Wali: {item.waliName}
                    </span>
                </div>
                <StatusBadge status={item.status} />
            </div>
            <div className="grid grid-cols-1 gap-3 mt-4 text-xs sm:grid-cols-2">
                <div>
                    <p className="mb-1 font-bold tracking-wide text-gray-400 uppercase">Jadwal terapi</p>
                    <p className="flex items-center gap-1.5 font-bold text-gray-800"><Calendar className="h-3.5 w-3.5 text-[#2B7A75]" /> {item.tanggal}</p>
                    <p className="mt-1 flex items-center gap-1.5 font-medium text-gray-500"><Clock className="h-3.5 w-3.5" /> {item.waktu}</p>
                </div>
                <div>
                    <p className="mb-1 font-bold tracking-wide text-gray-400 uppercase">Terapis</p>
                    <p className="flex items-center gap-1.5 font-bold text-[#1E5C58]"><User className="h-3.5 w-3.5 text-[#2B7A75]" /> {item.terapisName}</p>
                    <span className="mt-2 inline-flex rounded-md border border-teal-100 bg-teal-50 px-2 py-1 text-[10px] font-bold text-[#1E5C58]">{item.tipeTermi}</span>
                </div>
            </div>
            <div className="p-3 mt-3 text-xs leading-relaxed text-gray-500 rounded-xl bg-gray-50"><span className="font-bold text-gray-600">Keterangan: </span>{item.keterangan}</div>
            <div className="flex flex-wrap gap-2 pt-3 mt-4 border-t border-gray-100">
                {isBelumPresensi ? (
                    <button onClick={() => onMulai(item)} className="flex-1 rounded-lg bg-[#2B7A75] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1E5C58]">Mulai</button>
                ) : (
                    <button onClick={() => onEdit(item)} className="flex-1 rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-[#1E5C58] transition-colors hover:bg-teal-50">Edit</button>
                )}
                <button onClick={() => onDetail(item)} className="flex-1 px-3 py-2 text-xs font-bold text-gray-600 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50">Detail</button>
            </div>
        </article>
    );
}

function MobileRescheduleCard({ item }: { item: RescheduleData }) {
    return (
        <article className="p-4 bg-white border border-teal-100 shadow-sm rounded-2xl">
            <h4 className="text-sm font-extrabold text-gray-800">{item.pasienName}</h4>
            <span className="mt-1 inline-flex rounded-md border border-orange-200 bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-800">Wali: {item.waliName}</span>
            <div className="grid gap-3 mt-4 sm:grid-cols-2">
                <div className="p-3 text-xs rounded-xl bg-gray-50"><p className="mb-2 font-bold tracking-wide text-gray-400 uppercase">Jadwal semula</p><p className="font-bold text-gray-800">{item.jadwalSemulaTanggal}</p><p className="mt-1 text-gray-500">{item.jadwalSemulaWaktu}</p></div>
                <div className="p-3 text-xs rounded-xl bg-teal-50/60"><p className="mb-2 font-bold uppercase tracking-wide text-[#2B7A75]">Jadwal baru</p><p className="font-bold text-[#1E5C58]">{item.jadwalBaruTanggal}</p><p className="mt-1 text-gray-500">{item.jadwalBaruWaktu}</p></div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-500"><span className="font-bold text-gray-600">Alasan: </span>{item.alasan}</p>
        </article>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── REKAP KEHADIRAN ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
type StatusRekap = "Hadir" | "Izin" | "Sakit" | "Tidak Hadir";
type Periode = "Harian" | "Mingguan" | "Bulanan" | "Custom";

interface RekapRow {
    id: string;
    anak: string;
    terapis: string;
    jenisTerapi: string;
    tanggal: string; // ISO: yyyy-mm-dd
    jam: string; // "09.00"
    status: StatusRekap;
}

interface PeriodeValues {
    hari: string; // yyyy-mm-dd
    minggu: string; // yyyy-Www
    bulan: string; // yyyy-mm
    dari: string; // yyyy-mm-dd
    sampai: string; // yyyy-mm-dd
}

// Dummy data rekap (ganti dengan hasil API nanti)
const dummyRekap: RekapRow[] = [
    { id: "1", anak: "Rayhan", terapis: "Alief Arifun", jenisTerapi: "Terapi Wicara", tanggal: "2026-09-02", jam: "09.00", status: "Hadir" },
    { id: "2", anak: "Zamzam", terapis: "Nindya Zahri", jenisTerapi: "PLB (Paedagog)", tanggal: "2026-09-03", jam: "11.36", status: "Hadir" },
    { id: "3", anak: "Alya", terapis: "Nindya Zahri", jenisTerapi: "Terapi Wicara", tanggal: "2026-09-04", jam: "09.00", status: "Izin" },
    { id: "4", anak: "Shofiya", terapis: "Alief Arifun", jenisTerapi: "Fisioterapi", tanggal: "2026-09-05", jam: "13.00", status: "Hadir" },
    { id: "5", anak: "Rayhan", terapis: "Alief Arifun", jenisTerapi: "Terapi Wicara", tanggal: "2026-09-09", jam: "09.00", status: "Izin" },
    { id: "6", anak: "Zamzam", terapis: "Nindya Zahri", jenisTerapi: "PLB (Paedagog)", tanggal: "2026-09-10", jam: "11.36", status: "Hadir" },
    { id: "7", anak: "Bagas", terapis: "Alief Arifun", jenisTerapi: "Fisioterapi", tanggal: "2026-09-11", jam: "10.30", status: "Tidak Hadir" },
    { id: "8", anak: "Lutfy", terapis: "Alief Arifun", jenisTerapi: "Terapi Okupasi", tanggal: "2026-09-12", jam: "16.51", status: "Sakit" },
    { id: "9", anak: "Rayhan", terapis: "Alief Arifun", jenisTerapi: "Terapi Wicara", tanggal: "2026-09-16", jam: "09.00", status: "Hadir" },
    { id: "10", anak: "Shofiya", terapis: "Alief Arifun", jenisTerapi: "Fisioterapi", tanggal: "2026-09-19", jam: "13.00", status: "Hadir" },
    { id: "11", anak: "Lutfy", terapis: "Alief Arifun", jenisTerapi: "Terapi Okupasi", tanggal: "2026-09-25", jam: "16.51", status: "Hadir" },
    { id: "12", anak: "Rayhan", terapis: "Alief Arifun", jenisTerapi: "Terapi Wicara", tanggal: "2026-08-26", jam: "09.00", status: "Hadir" },
    { id: "13", anak: "Zamzam", terapis: "Nindya Zahri", jenisTerapi: "PLB (Paedagog)", tanggal: "2026-10-01", jam: "11.36", status: "Hadir" },
];

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const PERIODE_OPTIONS: Periode[] = ["Harian", "Mingguan", "Bulanan", "Custom"];
const PREVIEW_LIMIT = 10;

const DEFAULT_PERIODE: Periode = "Bulanan";
const DEFAULT_PERIODE_VALUES: PeriodeValues = {
    hari: "",
    minggu: "",
    bulan: "2026-09",
    dari: "",
    sampai: "",
};

// "2026-09-02" -> "02/09/2026"
function formatTanggalRekap(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

// "2026-W36" -> [senin, minggu] dalam format yyyy-mm-dd
function weekRange(value: string): [string, string] | null {
    const match = value.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const week = Number(match[2]);
    const DAY = 86400000;

    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = (jan4.getUTCDay() + 6) % 7; // Senin = 0
    const monday = new Date(jan4.getTime() - dayOfWeek * DAY + (week - 1) * 7 * DAY);
    const sunday = new Date(monday.getTime() + 6 * DAY);

    return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
}

function matchPeriode(tanggal: string, periode: Periode, v: PeriodeValues) {
    switch (periode) {
        case "Harian":
            return !v.hari || tanggal === v.hari;
        case "Mingguan": {
            const range = v.minggu ? weekRange(v.minggu) : null;
            return !range || (tanggal >= range[0] && tanggal <= range[1]);
        }
        case "Bulanan":
            return !v.bulan || tanggal.startsWith(v.bulan);
        case "Custom":
            return (!v.dari || tanggal >= v.dari) && (!v.sampai || tanggal <= v.sampai);
    }
}

function periodeLabel(periode: Periode, v: PeriodeValues): string | null {
    if (periode === "Harian" && v.hari) return formatTanggalRekap(v.hari);
    if (periode === "Mingguan" && v.minggu) {
        const m = v.minggu.match(/^(\d{4})-W(\d{2})$/);
        return m ? `Minggu ${Number(m[2])}, ${m[1]}` : null;
    }
    if (periode === "Bulanan" && v.bulan) {
        const [y, m] = v.bulan.split("-");
        return `${BULAN_SINGKAT[Number(m) - 1]} ${y}`;
    }
    if (periode === "Custom" && (v.dari || v.sampai)) {
        return `${v.dari ? formatTanggalRekap(v.dari) : "..."} – ${v.sampai ? formatTanggalRekap(v.sampai) : "..."}`;
    }
    return null;
}

const rekapInputClass =
    "w-full px-4 py-2.5 bg-white border border-teal-100 rounded-xl text-base text-gray-700 font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]";

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className="block mb-1.5 text-xs font-bold text-gray-500">{children}</label>;
}

function FilterSelect({
    label,
    value,
    onChange,
    allLabel,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    allLabel: string;
    options: string[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setHighlightedIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isOpen]);

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div ref={dropdownRef} className="relative">
            <FieldLabel>{label}</FieldLabel>
            <div
                className={`${rekapInputClass} relative flex items-center pr-11 cursor-text`}
                onClick={() => setIsOpen(true)}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={isOpen ? search : value}
                    onFocus={() => {
                        setIsOpen(true);
                        setSearch("");
                    }}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(0);
                    }}
                    onKeyDown={(event) => {
                        const optionCount = filteredOptions.length + 1;

                        if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setIsOpen(true);
                            setHighlightedIndex((index) => Math.min(index + 1, optionCount - 1));
                        }
                        if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setHighlightedIndex((index) => Math.max(index - 1, 0));
                        }
                        if (event.key === "Enter") {
                            event.preventDefault();
                            const selectedOption = highlightedIndex === 0
                                ? ""
                                : filteredOptions[highlightedIndex - 1];
                            if (selectedOption !== undefined || highlightedIndex === 0) {
                                onChange(selectedOption);
                                setSearch("");
                                setIsOpen(false);
                            }
                        }
                        if (event.key === "Escape") setIsOpen(false);
                    }}
                    placeholder={allLabel}
                    aria-label={`Cari ${label.toLowerCase()}`}
                    className="w-full p-0 text-base text-gray-700 bg-transparent border-0 outline-none placeholder:text-gray-500"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-label={`Buka pilihan ${label.toLowerCase()}`}
                    tabIndex={-1}
                    className="absolute right-0 flex items-center justify-center h-full cursor-pointer w-11"
                >
                    <ChevronDown
                        className={`w-4 h-4 text-gray-700 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                </button>
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden bg-white border border-gray-100 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.12)]">
                    <div className="max-h-56 overflow-y-auto p-1.5" role="listbox">
                        <button
                            type="button"
                            onClick={() => {
                                onChange("");
                                setSearch("");
                                setIsOpen(false);
                            }}
                            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${highlightedIndex === 0 ? "bg-teal-50" : "hover:bg-gray-50"} ${!value ? "font-semibold text-[#1E5C58]" : "text-gray-700"}`}
                        >
                            {allLabel}
                        </button>
                        {filteredOptions.map((option, index) => (
                            <button
                                key={option}
                                type="button"
                                role="option"
                                aria-selected={value === option}
                                onClick={() => {
                                    onChange(option);
                                    setSearch("");
                                    setIsOpen(false);
                                }}
                                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${highlightedIndex === index + 1 ? "bg-teal-50" : "hover:bg-gray-50"} ${value === option ? "font-semibold text-[#1E5C58]" : "text-gray-700"}`}
                            >
                                {option}
                            </button>
                        ))}
                        {filteredOptions.length === 0 && (
                            <p className="px-3 py-3 text-sm text-gray-400">Data tidak ditemukan.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadgeRekap({ status }: { status: StatusRekap }) {
    const styles: Record<StatusRekap, string> = {
        Hadir: "bg-green-50 text-emerald-600 border-green-200",
        Izin: "bg-amber-50 text-amber-600 border-amber-200",
        Sakit: "bg-blue-50 text-blue-500 border-blue-200",
        "Tidak Hadir": "bg-red-50 text-red-600 border-red-200",
    };
    return (
        <span className={`inline-flex items-center justify-center px-3 py-1 text-[11px] font-extrabold rounded-full border ${styles[status]}`}>
            {status}
        </span>
    );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-bold text-[#1E5C58] bg-teal-50 border border-teal-100 rounded-full">
            {label}
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Hapus filter ${label}`}
                className="cursor-pointer flex items-center justify-center w-4 h-4 rounded-full text-[#2B7A75] hover:bg-teal-100 transition-colors"
            >
                <X className="w-3 h-3" strokeWidth={3} />
            </button>
        </span>
    );
}

function RekapKehadiran() {
    const [anak, setAnak] = useState("");
    const [terapis, setTerapis] = useState("");
    const [jenisTerapi, setJenisTerapi] = useState("");
    const [periode, setPeriode] = useState<Periode>(DEFAULT_PERIODE);
    const [periodeValues, setPeriodeValues] = useState<PeriodeValues>(DEFAULT_PERIODE_VALUES);

    // Opsi dropdown diambil dari data
    const anakOptions = useMemo(() => [...new Set(dummyRekap.map((r) => r.anak))].sort(), []);
    const terapisOptions = useMemo(() => [...new Set(dummyRekap.map((r) => r.terapis))].sort(), []);
    const jenisOptions = useMemo(() => [...new Set(dummyRekap.map((r) => r.jenisTerapi))].sort(), []);

    const filtered = useMemo(
        () =>
            dummyRekap
                .filter(
                    (r) =>
                        (!anak || r.anak === anak) &&
                        (!terapis || r.terapis === terapis) &&
                        (!jenisTerapi || r.jenisTerapi === jenisTerapi) &&
                        matchPeriode(r.tanggal, periode, periodeValues),
                )
                .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam)),
        [anak, terapis, jenisTerapi, periode, periodeValues],
    );

    const preview = filtered.slice(0, PREVIEW_LIMIT);

    const setPeriodeValue = (key: keyof PeriodeValues, value: string) =>
        setPeriodeValues((prev) => ({ ...prev, [key]: value }));

    const clearPeriode = () =>
        setPeriodeValues((prev) =>
            periode === "Harian" ? { ...prev, hari: "" }
                : periode === "Mingguan" ? { ...prev, minggu: "" }
                    : periode === "Bulanan" ? { ...prev, bulan: "" }
                        : { ...prev, dari: "", sampai: "" },
        );

    const handleReset = () => {
        setAnak("");
        setTerapis("");
        setJenisTerapi("");
        setPeriode(DEFAULT_PERIODE);
        setPeriodeValues(DEFAULT_PERIODE_VALUES);
    };

    const handleExport = (type: "excel" | "pdf") => {
        // TODO: sambungkan ke API export. Kirim filter aktif (anak, terapis, jenisTerapi, periode).
        console.log(`Export ${type}`, { anak, terapis, jenisTerapi, periode, periodeValues, total: filtered.length });
    };

    // Chip filter aktif
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (anak) chips.push({ key: "anak", label: anak, onRemove: () => setAnak("") });
    if (terapis) chips.push({ key: "terapis", label: terapis, onRemove: () => setTerapis("") });
    if (jenisTerapi) chips.push({ key: "jenis", label: jenisTerapi, onRemove: () => setJenisTerapi("") });
    const labelPeriode = periodeLabel(periode, periodeValues);
    if (labelPeriode) chips.push({ key: "periode", label: labelPeriode, onRemove: clearPeriode });

    return (
        <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <div className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                <h3 className="text-sm font-extrabold text-[#1E5C58]">Rekap Kehadiran</h3>
            </div>
            {/* ── Filter ── */}
            <div className="p-6 space-y-5">
                <div>
                    <p className="mb-3 text-xs font-extrabold tracking-wider text-gray-400 uppercase">Filter</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FilterSelect label="Anak" value={anak} onChange={setAnak} allLabel="Semua anak" options={anakOptions} />
                        <FilterSelect label="Terapis" value={terapis} onChange={setTerapis} allLabel="Semua terapis" options={terapisOptions} />
                        <FilterSelect label="Jenis Terapi" value={jenisTerapi} onChange={setJenisTerapi} allLabel="Semua jenis" options={jenisOptions} />
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-xs font-extrabold tracking-wider text-gray-400 uppercase">Periode</p>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        {/* Segmented control */}
                        <div className="flex p-1 bg-[#F4F9F8] border border-teal-50 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
                            {PERIODE_OPTIONS.map((opt) => {
                                const isActive = periode === opt;
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setPeriode(opt)}
                                        className={`cursor-pointer flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm transition-all ${isActive
                                            ? "bg-[#1E5C58] text-white font-bold shadow-sm"
                                            : "text-gray-400 font-semibold hover:text-[#2B7A75]"
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Input periode mengikuti pilihan */}
                        <div className="flex-1">
                            {periode === "Harian" && (
                                <>
                                    <FieldLabel>Tanggal</FieldLabel>
                                    <input type="date" value={periodeValues.hari} onChange={(e) => setPeriodeValue("hari", e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                                </>
                            )}
                            {periode === "Mingguan" && (
                                <>
                                    <FieldLabel>Minggu</FieldLabel>
                                    <input type="week" value={periodeValues.minggu} onChange={(e) => setPeriodeValue("minggu", e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                                </>
                            )}
                            {periode === "Bulanan" && (
                                <>
                                    <FieldLabel>Bulan</FieldLabel>
                                    <input type="month" value={periodeValues.bulan} onChange={(e) => setPeriodeValue("bulan", e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                                </>
                            )}
                            {periode === "Custom" && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <FieldLabel>Dari</FieldLabel>
                                        <input type="date" value={periodeValues.dari} max={periodeValues.sampai || undefined} onChange={(e) => setPeriodeValue("dari", e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                                    </div>
                                    <div>
                                        <FieldLabel>Sampai</FieldLabel>
                                        <input type="date" value={periodeValues.sampai} min={periodeValues.dari || undefined} onChange={(e) => setPeriodeValue("sampai", e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Filter Aktif ── */}
            <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">Aktif:</span>
                    {chips.length > 0 ? (
                        chips.map((chip) => <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />)
                    ) : (
                        <span className="text-xs font-medium text-gray-400">Semua data</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-red-600 transition-colors cursor-pointer shrink-0 hover:text-red-700"
                >
                    Reset
                </button>
            </div>

            {/* ── Preview ── */}
            <div className="flex flex-wrap justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => handleExport("excel")}
                    disabled={filtered.length === 0}
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2B7A75] rounded-lg shadow-sm hover:bg-[#1E5C58] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-3.5 h-3.5" strokeWidth={3} />
                    Export Excel
                </button>
                <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    disabled={filtered.length === 0}
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#1E5C58] bg-white border border-teal-100 rounded-lg shadow-sm hover:bg-teal-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-3.5 h-3.5" strokeWidth={3} />
                    Export PDF
                </button>
            </div>

            <div className="border-t border-gray-100">
                <div className="flex items-center justify-between gap-3 px-6 py-4">
                    <h3 className="text-sm font-extrabold text-[#1E5C58]">
                        Preview ({PREVIEW_LIMIT} baris pertama)
                    </h3>
                    <span className="px-3 py-1 text-[11px] font-bold text-[#1E5C58] bg-teal-50 border border-teal-100 rounded-full">
                        Total: {filtered.length} data
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                            <tr className="bg-[#F4F9F8] border-b border-teal-50">
                                {["Anak", "Terapis", "Jenis Terapi", "Tanggal", "Jam", "Status"].map((h) => (
                                    <th key={h} className="px-6 py-3 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {preview.map((row) => (
                                <tr key={row.id} className="hover:bg-[#F4F9F8]/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{row.anak}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-[#1E5C58]">{row.terapis}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-block px-2.5 py-1 text-[11px] font-bold text-[#1E5C58] bg-teal-50 rounded-md border border-teal-100">
                                            {row.jenisTerapi}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{formatTanggalRekap(row.tanggal)}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-400">{row.jam}</td>
                                    <td className="px-6 py-4"><StatusBadgeRekap status={row.status} /></td>
                                </tr>
                            ))}
                            {preview.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-sm text-center text-gray-400">
                                        Tidak ada data kehadiran untuk filter ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Export ── */}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE UTAMA ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function PresensiPage() {
    const [activeTab, setActiveTab] = useState("Presensi");
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [presensiData, setPresensiData] = useState(initialDummyPresensi);
    const [presensiRescheduleData, setPresensiRescheduleData] = useState(
        initialDummyPresensiReschedule,
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [rescheduleDateFrom, setRescheduleDateFrom] = useState("");
    const [rescheduleDateTo, setRescheduleDateTo] = useState("");
    const [rescheduleStatus, setRescheduleStatus] = useState<"Semua" | RescheduleData["status"]>("Semua");
    const [scanHistory, setScanHistory] = useState<{ code: string; time: string }[]>([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const cameraVideoRef = useRef<HTMLVideoElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const [pageSize, setPageSize] = useState(10);
    const [presensiPage, setPresensiPage] = useState(1);
    const [presensiReschedulePage, setPresensiReschedulePage] = useState(1);
    const [reschedulePage, setReschedulePage] = useState(1);
    const [detailTarget, setDetailTarget] = useState<PresensiData | null>(null);
    const [presensiTarget, setPresensiTarget] = useState<PresensiManualTarget | null>(null);
    const [presensiInitialValues, setPresensiInitialValues] =
        useState<PresensiManualInitialValues | undefined>(undefined);
    const [presensiMode, setPresensiMode] = useState<"create" | "edit">("create");

    useEffect(() => {
        setPresensiPage(1);
        setPresensiReschedulePage(1);
        setReschedulePage(1);
    }, [searchTerm, selectedDate, pageSize, rescheduleDateFrom, rescheduleDateTo, rescheduleStatus]);

    const query = searchTerm.trim().toLowerCase();
    const dateLabel = selectedDate ? formatTanggalDisplay(selectedDate) : "";
    const todayLabel = formatTanggalDisplay(new Date().toISOString().slice(0, 10));
    const matchesPresensiFilter = (item: PresensiData) => {
        const matchesQuery = !query || [
            item.pasienName,
            item.waliName,
            item.terapisName,
            item.tipeTermi,
            item.status,
        ].some((value) => value.toLowerCase().includes(query));
        const matchesDate = !dateLabel || item.tanggal === dateLabel;
        return matchesQuery && matchesDate;
    };
    const filteredPresensi = sortPresensiData(presensiData.filter(matchesPresensiFilter));
    const filteredPresensiReschedule = sortPresensiData(
        presensiRescheduleData.filter((item) => {
            const matchesQuery = !query || [
                item.pasienName,
                item.waliName,
                item.terapisName,
                item.tipeTermi,
                item.status,
            ].some((value) => value.toLowerCase().includes(query));
            const matchesRescheduleDate = item.reschedule?.tanggal === (dateLabel || todayLabel);
            return Boolean(item.reschedule) && matchesQuery && matchesRescheduleDate;
        }),
    );
    const filteredReschedule = dummyReschedule.filter((item) => {
        const matchesQuery = !query || [item.pasienName, item.waliName, item.terapis, item.alasan]
            .some((value) => value.toLowerCase().includes(query));
        const tanggalSemula = tanggalRescheduleToIso(item.jadwalSemulaTanggal);
        const matchesDate = (!rescheduleDateFrom || tanggalSemula >= rescheduleDateFrom) &&
            (!rescheduleDateTo || tanggalSemula <= rescheduleDateTo);
        const matchesStatus = rescheduleStatus === "Semua" || item.status === rescheduleStatus;
        return matchesQuery && matchesDate && matchesStatus;
    });
    const visiblePresensi = filteredPresensi.slice(
        (presensiPage - 1) * pageSize,
        presensiPage * pageSize,
    );
    const visiblePresensiReschedule = filteredPresensiReschedule.slice(
        (presensiReschedulePage - 1) * pageSize,
        presensiReschedulePage * pageSize,
    );
    const visibleReschedule = filteredReschedule.slice(
        (reschedulePage - 1) * pageSize,
        reschedulePage * pageSize,
    );
    const rescheduleStatusOptions: ("Semua" | RescheduleData["status"])[] = ["Semua", "Hadir", "Sakit", "Izin", "Tidak Hadir"];

    const tabs = [
        { id: "Presensi", label: "Presensi", icon: CheckCircle2 },
        { id: "Scan Barcode", label: "Scan Barcode", icon: Activity },
        { id: "Reschedule", label: "Reschedule", icon: Calendar },
        { id: "Rekap Kehadiran", label: "Rekap Kehadiran", icon: CalendarDays },
    ];

    const handleMulai = (item: PresensiData) => {
        setPresensiMode("create");
        setPresensiInitialValues(undefined);
        setPresensiTarget({
            id: item.id,
            pasienName: item.pasienName,
            tanggal: item.tanggal,
            waktu: item.waktu,
        });
    };

    const handleEdit = (item: PresensiData) => {
        setPresensiMode("edit");
        setPresensiInitialValues({
            status: item.status === "Belum Presensi" ? undefined : item.status,
            keterangan: item.keterangan === "-" ? "" : item.keterangan,
            reschedule: Boolean(item.reschedule),
            tanggalBaru: item.reschedule
                ? formatTanggalInput(item.reschedule.tanggal)
                : undefined,
            jamMulaiBaru: item.reschedule
                ? formatWaktuInput(item.reschedule.waktu)[0]
                : undefined,
            jamSelesaiBaru: item.reschedule
                ? formatWaktuInput(item.reschedule.waktu)[1]
                : undefined,
        });
        setPresensiTarget({
            id: item.id,
            pasienName: item.pasienName,
            tanggal: item.tanggal,
            waktu: item.waktu,
        });
    };

    const handleDetail = (item: PresensiData) => {
        setDetailTarget(item);
    };

    const addScanHistory = (code: string) => {
        if (!code.trim()) return;

        setScanHistory((history) => [
            { code: code.trim(), time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) },
            ...history,
        ]);
    };

    const stopCamera = () => {
        cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
        if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
        setIsCameraActive(false);
    };

    const startCamera = async () => {
        setCameraError("");

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("Browser ini tidak mendukung akses kamera.");
            return;
        }

        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false,
            });
            cameraStreamRef.current = stream;
            if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = stream;
                await cameraVideoRef.current.play();
            }
            setIsCameraActive(true);
        } catch {
            setCameraError("Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.");
            setIsCameraActive(false);
        }
    };

    useEffect(() => {
        return () => {
            cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    useEffect(() => {
        const video = cameraVideoRef.current;
        const stream = cameraStreamRef.current;
        if (!isCameraActive || !video || !stream) return;

        video.srcObject = stream;
        void video.play();
    }, [isCameraActive]);

    useEffect(() => {
        if (!isCameraActive || !cameraVideoRef.current) return;

        const BarcodeDetectorClass = (window as Window & {
            BarcodeDetector?: new (options?: { formats: string[] }) => {
                detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
            };
        }).BarcodeDetector;

        if (!BarcodeDetectorClass) return;

        const detector = new BarcodeDetectorClass({ formats: ["code_128", "code_39", "ean_13", "qr_code"] });
        let cancelled = false;

        const detect = async () => {
            if (cancelled || !cameraVideoRef.current) return;
            try {
                const results = await detector.detect(cameraVideoRef.current);
                const code = results[0]?.rawValue;
                if (code) {
                    addScanHistory(code);
                    stopCamera();
                    return;
                }
            } catch {
                // Lanjutkan kamera jika satu frame gagal dibaca.
            }
            if (!cancelled) window.requestAnimationFrame(detect);
        };

        window.requestAnimationFrame(detect);
        return () => {
            cancelled = true;
        };
    }, [isCameraActive]);

    const handleSavePresensi = (payload: PresensiManualPayload) => {
        const updateData = (data: PresensiData[]) =>
            data.map((item) => {
                if (item.id !== payload.id) return item;

                return {
                    ...item,
                    status: payload.status,
                    keterangan: payload.keterangan || "-",
                    reschedule:
                        payload.reschedule &&
                            payload.tanggalBaru &&
                            payload.jamMulaiBaru &&
                            payload.jamSelesaiBaru
                            ? {
                                tanggal: formatTanggalDisplay(payload.tanggalBaru),
                                waktu: formatWaktuDisplay(
                                    payload.jamMulaiBaru,
                                    payload.jamSelesaiBaru,
                                ),
                            }
                            : undefined,
                };
            });

        setPresensiData(updateData);
        setPresensiRescheduleData(updateData);
        setPresensiTarget(null);
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
            <div className="flex flex-col flex-1 w-full px-4 py-8 sm:px-6 lg:px-8">

                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
                        <Users className="w-7 h-7 text-[#2B7A75]" strokeWidth={2.5} />
                        Manajemen Kehadiran
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Kelola data seluruh pasien untuk catatan kehadiran maupun pergantian jadwal.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="p-2 mb-6 bg-white border shadow-sm rounded-2xl border-teal-50">
                    <div className="flex w-full bg-[#F4F9F8] rounded-xl p-1.5 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex-1 flex items-center justify-center gap-2 whitespace-nowrap px-4 sm:px-6 py-3 rounded-lg text-sm cursor-pointer transition-all duration-300 ${isActive ? "text-white font-bold" : "text-gray-400 hover:text-[#2B7A75] font-semibold hover:bg-white/50"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute inset-0 bg-[#1E5C58] rounded-lg shadow-sm border border-teal-50/50"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon className={`relative z-10 w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col flex-1 w-full gap-6"
                    >
                        {/* ── TAB: PRESENSI ── */}
                        {activeTab === "Presensi" && (
                            <>
                                {/* Toolbar */}
                                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-white border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all shadow-sm text-gray-700 font-medium cursor-pointer"
                                    />
                                    <div className="relative w-full sm:w-72">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Search className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Cari anak atau terapis..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all shadow-sm text-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Tabel Presensi Hari Ini */}
                                <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                                        <div className="w-2 h-2 rounded-full bg-[#1E5C58]" />
                                        <h3 className="text-sm font-extrabold text-[#1E5C58]">Presensi Hari Ini</h3>
                                    </div>
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full text-left border-collapse min-w-[900px]">
                                            <thead>
                                                <tr className="bg-[#F4F9F8] border-b border-teal-50">
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Informasi Pasien</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Jadwal Terapi</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Terapis</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Tipe Terapi</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Status</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Keterangan</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {visiblePresensi.map((item) => (
                                                    <tr key={item.id} className="hover:bg-[#F4F9F8]/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-800 text-sm mb-1.5">{item.pasienName}</div>
                                                            <div className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md text-[10px] font-bold border border-orange-200">
                                                                Wali: {item.waliName}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="flex items-center gap-1.5 text-gray-800 font-bold mb-1">
                                                                <Calendar className="w-4 h-4 text-[#A2E4D3]" strokeWidth={2.5} /> {item.tanggal}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                                                <Clock className="w-3.5 h-3.5" /> {item.waktu}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm font-bold text-[#1E5C58]">
                                                                <User className="w-4 h-4 text-[#2B7A75]" strokeWidth={2.5} /> {item.terapisName}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-block px-2.5 py-1 bg-teal-50 text-[#1E5C58] rounded-md text-[11px] font-bold border border-teal-100">
                                                                {item.tipeTermi}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={item.status} />
                                                        </td>
                                                        <td className="py-4 px-6 text-xs font-medium text-gray-500 max-w-[180px] leading-relaxed">
                                                            {item.keterangan}
                                                        </td>
                                                        <ActionDropdown
                                                            item={item}
                                                            openDropdownId={openDropdownId}
                                                            setOpenDropdownId={setOpenDropdownId}
                                                            onMulai={handleMulai}
                                                            onEdit={handleEdit}
                                                            onDetail={handleDetail}
                                                        />
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 space-y-3 md:hidden">
                                        {visiblePresensi.map((item) => (
                                            <MobilePresensiCard key={item.id} item={item} onMulai={handleMulai} onEdit={handleEdit} onDetail={handleDetail} />
                                        ))}
                                        {visiblePresensi.length === 0 && <p className="py-8 text-sm text-center text-gray-400">Tidak ada data presensi.</p>}
                                    </div>
                                    <PaginationFooter
                                        totalItems={filteredPresensi.length}
                                        currentPage={presensiPage}
                                        pageSize={pageSize}
                                        onPageChange={setPresensiPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </div>

                                {/* Tabel Reschedule Hari Ini */}
                                <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                                        <div className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                                        <h3 className="text-sm font-extrabold text-[#1E5C58]">Jadwal Hasil Reschedule Hari Ini</h3>
                                    </div>
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full text-left border-collapse min-w-[900px]">
                                            <thead>
                                                <tr className="bg-[#F4F9F8] border-b border-teal-50">
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Informasi Pasien</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Jadwal Terapi</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Terapis</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Tipe Terapi</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Status</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Keterangan</th>
                                                    <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {visiblePresensiReschedule.map((item) => (
                                                    <tr key={item.id} className="hover:bg-[#F4F9F8]/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-800 text-sm mb-1.5">{item.pasienName}</div>
                                                            <div className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md text-[10px] font-bold border border-orange-200">
                                                                Wali: {item.waliName}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="flex items-center gap-1.5 text-gray-800 font-bold mb-1">
                                                                <Calendar className="w-4 h-4 text-[#A2E4D3]" strokeWidth={2.5} /> {item.tanggal}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                                                <Clock className="w-3.5 h-3.5" /> {item.waktu}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm font-bold text-[#1E5C58]">
                                                                <User className="w-4 h-4 text-[#2B7A75]" strokeWidth={2.5} /> {item.terapisName}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-block px-2.5 py-1 bg-teal-50 text-[#1E5C58] rounded-md text-[11px] font-bold border border-teal-100">
                                                                {item.tipeTermi}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={item.status} />
                                                        </td>
                                                        <td className="py-4 px-6 text-xs font-medium text-gray-500 max-w-[180px] leading-relaxed">
                                                            {item.keterangan}
                                                        </td>
                                                        <ActionDropdown
                                                            item={item}
                                                            openDropdownId={openDropdownId}
                                                            setOpenDropdownId={setOpenDropdownId}
                                                            onMulai={handleMulai}
                                                            onEdit={handleEdit}
                                                            onDetail={handleDetail}
                                                        />
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 space-y-3 md:hidden">
                                        {visiblePresensiReschedule.map((item) => (
                                            <MobilePresensiCard key={item.id} item={item} onMulai={handleMulai} onEdit={handleEdit} onDetail={handleDetail} />
                                        ))}
                                        {visiblePresensiReschedule.length === 0 && <p className="py-8 text-sm text-center text-gray-400">Tidak ada data reschedule.</p>}
                                    </div>
                                    <PaginationFooter
                                        totalItems={filteredPresensiReschedule.length}
                                        currentPage={presensiReschedulePage}
                                        pageSize={pageSize}
                                        onPageChange={setPresensiReschedulePage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </div>
                            </>
                        )}

                        {/* ── TAB: RESCHEDULE ── */}
                        {activeTab === "Reschedule" && (
                            <>
                                {/* Toolbar */}
                                <div className="flex flex-col gap-4 p-4 bg-white border border-teal-50 rounded-2xl sm:flex-row sm:items-end">
                                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                                        <label className="text-xs font-bold text-gray-500">
                                            Tanggal
                                            <input
                                                type="date"
                                                value={rescheduleDateFrom}
                                                onChange={(e) => setRescheduleDateFrom(e.target.value)}
                                                className="w-full px-4 py-2.5 mt-1.5 text-sm font-medium text-gray-700 transition-all bg-white border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer"
                                            />
                                        </label>
                                        <label className="text-xs font-bold text-gray-500">
                                            Sampai dengan
                                            <input
                                                type="date"
                                                value={rescheduleDateTo}
                                                min={rescheduleDateFrom || undefined}
                                                onChange={(e) => setRescheduleDateTo(e.target.value)}
                                                className="w-full px-4 py-2.5 mt-1.5 text-sm font-medium text-gray-700 transition-all bg-white border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer"
                                            />
                                        </label>
                                    </div>
                                    <div className="relative w-full sm:w-72">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                            <Search className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Cari anak atau terapis..."
                                            className="w-full py-2.5 pl-10 pr-4 text-sm text-gray-700 transition-all bg-white border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
                                        />
                                    </div>
                                </div>

                                {/* Tabel Reschedule */}
                                <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                                    <div className="flex flex-col gap-4 px-6 py-4 border-b border-gray-100 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                                            <h3 className="text-sm font-extrabold text-[#1E5C58]">Jadwal yang Dialihkan (Reschedule)</h3>
                                            <span className="px-2 py-1 text-[10px] font-bold text-[#1E5C58] bg-teal-50 rounded-full">{filteredReschedule.length} jadwal</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {rescheduleStatusOptions.map((status) => {
                                                const count = status === "Semua"
                                                    ? dummyReschedule.length
                                                    : dummyReschedule.filter((item) => item.status === status).length;
                                                const active = rescheduleStatus === status;
                                                return (
                                                    <button
                                                        key={status}
                                                        type="button"
                                                        onClick={() => setRescheduleStatus(status)}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors cursor-pointer ${active ? "text-white bg-[#2B7A75] border-[#2B7A75]" : "text-gray-600 bg-white border-gray-200 hover:border-teal-200 hover:text-[#1E5C58]"}`}
                                                    >
                                                        {status} ({count})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full text-left border-collapse min-w-[900px]">
                                            <thead>
                                                <tr className="bg-[#F4F9F8] border-b border-teal-50">
                                                    <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Pasien</th>
                                                    <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Terapis</th>
                                                    <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Jadwal Semula</th>
                                                    <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Jadwal Baru</th>
                                                    <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">Alasan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {visibleReschedule.map((item) => (
                                                    <tr key={item.id} className="hover:bg-[#F4F9F8]/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-800 text-sm mb-1.5">{item.pasienName}</div>
                                                            <div className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md text-[10px] font-bold border border-orange-200">
                                                                Wali: {item.waliName}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-[#1E5C58]">{item.terapis}</td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="flex items-center gap-1.5 text-gray-800 font-bold mb-1">
                                                                <Calendar className="w-4 h-4 text-[#A2E4D3]" strokeWidth={2.5} /> {item.jadwalSemulaTanggal}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                                                <Clock className="w-3.5 h-3.5" /> {item.jadwalSemulaWaktu}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <div className="inline-block px-3 py-2 bg-emerald-50 rounded-xl">
                                                                <div className="flex items-center gap-1.5 text-[#1E5C58] font-bold mb-1">
                                                                    <Calendar className="w-3.5 h-3.5 text-[#2B7A75]" strokeWidth={2.5} /> {item.jadwalBaruTanggal}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                                                    <Clock className="w-3.5 h-3.5" /> {item.jadwalBaruWaktu}
                                                                </div>
                                                            </div>
                                                            <div className="mt-1 text-[10px] font-bold text-[#2B7A75]">
                                                                Bergeser {hitungHariPergeseran(item.jadwalSemulaTanggal, item.jadwalBaruTanggal)} hari
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-xs font-medium text-gray-500 max-w-[240px] leading-relaxed">
                                                            <StatusBadge status={item.status} />
                                                            <div>{item.alasan}</div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 space-y-3 md:hidden">
                                        {visibleReschedule.map((item) => <MobileRescheduleCard key={item.id} item={item} />)}
                                        {visibleReschedule.length === 0 && <p className="py-8 text-sm text-center text-gray-400">Tidak ada jadwal reschedule.</p>}
                                    </div>
                                    <PaginationFooter
                                        totalItems={filteredReschedule.length}
                                        currentPage={reschedulePage}
                                        pageSize={pageSize}
                                        onPageChange={setReschedulePage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </div>
                            </>
                        )}

                        {/* ── TAB: REKAP KEHADIRAN ── */}
                        {activeTab === "Rekap Kehadiran" && <RekapKehadiran />}

                        {/* ── TAB: LAINNYA (Scan Barcode) ── */}
                        {activeTab === "Scan Barcode" && (
                            <div className="grid items-stretch grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                                <div className="overflow-hidden bg-white border border-teal-50 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2 text-sm font-extrabold text-[#1E5C58]">
                                            <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                                            Scan Barcode Presensi
                                        </div>
                                        <button
                                            type="button"
                                            onClick={isCameraActive ? stopCamera : startCamera}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-emerald-300" />
                                            {isCameraActive ? "Matikan Kamera" : "Siap Scan"}
                                        </button>
                                    </div>

                                    <div className="relative m-6 flex min-h-[250px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#2B7A75] bg-[#F4F9F8]/60 px-5 py-6 text-center">
                                        <div className={`relative z-10 flex flex-col items-center ${isCameraActive ? "px-6 py-5 bg-white/85 rounded-2xl backdrop-blur-sm" : ""}`}>
                                            {isCameraActive ? (
                                                <Camera className="w-9 h-9 mb-5 text-[#1E5C58]" strokeWidth={1.8} />
                                            ) : (
                                                <ScanLine className="w-9 h-9 mb-5 text-[#1E5C58]" strokeWidth={1.8} />
                                            )}
                                            <h3 className="text-base font-extrabold text-[#1E5C58]">
                                                {isCameraActive ? "Arahkan barcode ke kamera" : "Scan barcode kartu pasien"}
                                            </h3>
                                            <p className="max-w-sm mt-2 text-sm font-medium leading-relaxed text-gray-400">
                                                {isCameraActive ? "Pastikan barcode terlihat jelas di dalam kamera." : "Klik tombol Scan Barcode untuk mulai."}
                                            </p>

                                            {isCameraActive && (
                                                <button
                                                    type="button"
                                                    onClick={stopCamera}
                                                    aria-label="Batal scan"
                                                    title="Batal scan"
                                                    className="inline-flex items-center justify-center mt-5 text-white transition-colors bg-red-500 rounded-full shadow-sm w-11 h-11 hover:bg-red-600"
                                                >
                                                    <X className="w-5 h-5" strokeWidth={2.5} />
                                                </button>
                                            )}

                                            {!isCameraActive && (
                                                <button
                                                    type="button"
                                                    onClick={startCamera}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 mt-5 text-sm font-bold text-white bg-[#2B7A75] rounded-xl shadow-sm hover:bg-[#1E5C58] transition-colors"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                    Scan Barcode
                                                </button>
                                            )}

                                            {cameraError && (
                                                <p className="max-w-sm mt-3 text-xs font-semibold text-red-500">{cameraError}</p>
                                            )}

                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden bg-white border border-teal-50 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                                        <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                                        <h3 className="text-sm font-extrabold text-[#1E5C58]">Cara Scan Barcode</h3>
                                    </div>
                                    <div className="p-5">
                                        <p className="mb-4 text-sm font-medium leading-relaxed text-gray-500">
                                            Ikuti langkah berikut untuk mencatat kehadiran pasien dengan barcode.
                                        </p>
                                        <div className="space-y-3">
                                            {[
                                                "Klik tombol Scan Barcode untuk membuka kamera.",
                                                "Arahkan barcode kartu pasien ke kotak scan.",
                                                "Pastikan barcode terlihat jelas dan pencahayaan cukup.",
                                                "Tunggu sampai barcode berhasil terbaca.",
                                            ].map((step, index) => (
                                                <div key={step} className="flex items-start gap-3">
                                                    <span className="flex items-center justify-center flex-none w-7 h-7 text-xs font-extrabold text-white bg-[#2B7A75] rounded-full">
                                                        {index + 1}
                                                    </span>
                                                    <p className="pt-1 text-sm font-medium leading-relaxed text-gray-600">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-start gap-3 p-3 mt-4 bg-[#F4F9F8] rounded-xl">
                                            <ScanLine className="flex-none w-5 h-5 mt-0.5 text-[#2B7A75]" />
                                            <p className="text-xs font-medium leading-relaxed text-[#1E5C58]">
                                                Gunakan tombol X pada modal kamera jika ingin membatalkan proses scan.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {isCameraActive && typeof document !== "undefined" && createPortal(
                                    <div
                                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/55"
                                        role="dialog"
                                        aria-modal="true"
                                        aria-label="Preview kamera scan barcode"
                                    >
                                        <div className="relative w-full max-w-[560px] overflow-hidden bg-white rounded-3xl shadow-2xl">
                                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                                <h2 className="text-base font-extrabold text-[#1E5C58]">Scan Barcode Presensi</h2>
                                                <button
                                                    type="button"
                                                    onClick={stopCamera}
                                                    aria-label="Batal scan"
                                                    title="Batal scan"
                                                    className="inline-flex items-center justify-center w-9 h-9 text-[#8EA2BE] rounded-full hover:bg-gray-100 hover:text-[#30445F] transition-colors"
                                                >
                                                    <X className="w-6 h-6" strokeWidth={2} />
                                                </button>
                                            </div>
                                            <div className="p-6">
                                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-xl">
                                                    <video
                                                        ref={cameraVideoRef}
                                                        muted
                                                        playsInline
                                                        autoPlay
                                                        className="absolute inset-0 object-cover w-full h-full"
                                                    />
                                                    <div className="absolute inset-0 bg-black/25" />
                                                    <div className="absolute top-1/2 left-1/2 w-[48%] max-w-[250px] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                                                        <span className="absolute top-0 left-0 h-12 border-t-4 border-l-4 border-white w-14 rounded-tl-md" />
                                                        <span className="absolute top-0 right-0 h-12 border-t-4 border-r-4 border-white w-14 rounded-tr-md" />
                                                        <span className="absolute bottom-0 left-0 h-12 border-b-4 border-l-4 border-white w-14 rounded-bl-md" />
                                                        <span className="absolute bottom-0 right-0 h-12 border-b-4 border-r-4 border-white w-14 rounded-br-md" />
                                                    </div>
                                                </div>
                                                <p className="mt-5 text-sm font-medium leading-relaxed text-center text-[#7184A0]">
                                                    Arahkan kamera ke barcode kartu pasien.<br />
                                                    Pastikan pencahayaan cukup agar barcode mudah terbaca.
                                                </p>
                                            </div>
                                        </div>
                                    </div>,
                                    document.body,
                                )}

                                <div className="overflow-hidden bg-white border border-teal-50 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] lg:col-span-2">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2 text-sm font-extrabold text-[#1E5C58]">
                                            <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                                            Riwayat Scan Hari Ini
                                        </div>
                                        <span className="px-3 py-1 text-xs font-bold text-[#1E5C58] bg-[#F4F9F8] border border-teal-50 rounded-full">
                                            {scanHistory.length} presensi
                                        </span>
                                    </div>
                                    {scanHistory.length === 0 ? (
                                        <div className="flex min-h-[150px] items-center justify-center px-8 py-10 text-center">
                                            <p className="max-w-sm text-sm font-medium leading-relaxed text-gray-400">
                                                Belum ada presensi hari ini. Riwayat akan muncul di sini setelah scan berhasil.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 space-y-2">
                                            {scanHistory.map((scan, index) => (
                                                <div key={`${scan.code}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F4F9F8] rounded-xl">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-[#1E5C58]">
                                                        <ScanLine className="w-4 h-4 text-[#2B7A75]" />
                                                        {scan.code}
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-400">{scan.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

            </div>

            <FormCatatKehadiran
                open={!!presensiTarget}
                onCloseAction={() => setPresensiTarget(null)}
                target={presensiTarget}
                onSaveAction={handleSavePresensi}
                initialValues={presensiInitialValues}
                mode={presensiMode}
            />

            {detailTarget && (
                <FormDetailPresensi
                    item={detailTarget}
                    onCloseAction={() => setDetailTarget(null)}
                />
            )}
        </div>
    );
}
