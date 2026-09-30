"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    X,
    CheckCircle2,
    CalendarClock,
    ChevronDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
export type StatusKehadiran = "Hadir" | "Tidak Hadir" | "Izin" | "Sakit";

export interface PresensiManualTarget {
    id: string;
    pasienName: string;
    terapisName: string;
    tanggal: string; // "25/09/2026"
    waktu: string; // "Pukul 15.41 - 15.42" atau "15.41 - 15.42"
}

export interface PresensiManualPayload {
    id: string;
    status: StatusKehadiran;
    keterangan: string;
    reschedule: boolean;
    terapisBaru?: string;
    tanggalBaru?: string;
    jamMulaiBaru?: string;
    jamSelesaiBaru?: string;
}

export interface PresensiManualInitialValues {
    status?: StatusKehadiran;
    keterangan?: string;
    reschedule?: boolean;
    terapisBaru?: string;
    tanggalBaru?: string;
    jamMulaiBaru?: string;
    jamSelesaiBaru?: string;
}

type FormErrors = Partial<{
    status: string;
    keterangan: string;
    terapisBaru: string;
    tanggalBaru: string;
    jamMulaiBaru: string;
    jamSelesaiBaru: string;
}>;

const statusOptions: StatusKehadiran[] = [
    "Hadir",
    "Tidak Hadir",
    "Izin",
    "Sakit",
];

const terapisOptions = [
    "Alief Arifun",
    "Nindya Zahri",
    "Siti Aisyah",
];

function TerapisSelect({
    value,
    onChange,
    hasError,
    modalRef,
}: {
    value: string;
    onChange: (value: string) => void;
    hasError: boolean;
    modalRef: { current: HTMLDivElement | null };
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

    const filteredOptions = terapisOptions.filter((option) =>
        option.toLowerCase().includes(search.toLowerCase()),
    );

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        if (open) {
            setHighlightedIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const updateMenuPosition = () => {
            const modalRect = modalRef.current?.getBoundingClientRect();
            const triggerRect = wrapperRef.current?.getBoundingClientRect();
            if (!modalRect || !triggerRect) return;

            setMenuStyle({
                top: triggerRect.bottom + 8,
                left: triggerRect.left,
                width: triggerRect.width,
                maxHeight: Math.max(0, modalRect.bottom - triggerRect.bottom - 8),
            });
        };

        updateMenuPosition();
        window.addEventListener("resize", updateMenuPosition);
        document.addEventListener("scroll", updateMenuPosition, true);
        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            document.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [open, modalRef]);

    const selectOption = (option: string) => {
        onChange(option);
        setSearch("");
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div
                className={`relative flex items-center w-full px-3 py-2 bg-white border rounded-lg cursor-text ${hasError ? "border-red-300" : "border-gray-200 focus-within:border-[#2B7A75]"}`}
                onClick={() => setOpen(true)}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={open ? search : value}
                    placeholder="Pilih terapis"
                    onFocus={() => {
                        setOpen(true);
                        setSearch("");
                    }}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setOpen(true);
                        setHighlightedIndex(0);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setOpen(true);
                            if (filteredOptions.length > 0) {
                                setHighlightedIndex((index) => (index + 1) % filteredOptions.length);
                            }
                        } else if (event.key === "ArrowUp") {
                            event.preventDefault();
                            if (filteredOptions.length > 0) {
                                setHighlightedIndex((index) => (index - 1 + filteredOptions.length) % filteredOptions.length);
                            }
                        } else if (event.key === "Enter" && filteredOptions[highlightedIndex]) {
                            event.preventDefault();
                            selectOption(filteredOptions[highlightedIndex]);
                        } else if (event.key === "Escape") {
                            setOpen(false);
                        }
                    }}
                    className="w-full p-0 pr-8 text-xs font-medium text-gray-700 bg-transparent border-0 outline-none placeholder:text-gray-400"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Buka pilihan terapis"
                    onClick={() => setOpen((isOpen) => !isOpen)}
                    className="absolute right-0 flex items-center justify-center w-10 h-full cursor-pointer"
                >
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
            </div>

            {open && (
                <div
                    style={menuStyle}
                    className="fixed z-[80] overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.12)]"
                >
                    <div className="p-1.5" role="listbox">
                        {filteredOptions.map((option, index) => (
                            <button
                                key={option}
                                type="button"
                                role="option"
                                aria-selected={value === option}
                                onClick={() => selectOption(option)}
                                className={`w-full rounded-lg px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${highlightedIndex === index ? "bg-teal-50" : "hover:bg-gray-50"} ${value === option ? "font-semibold text-[#1E5C58]" : "text-gray-700"}`}
                            >
                                {option}
                            </button>
                        ))}
                        {filteredOptions.length === 0 && (
                            <p className="px-3 py-3 text-xs text-gray-400">Terapis tidak ditemukan.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Format "Pukul 15.41 - 15.42" -> "15.41 - 15.42" (biar muat di subheader)
function formatWaktuSingkat(waktu: string) {
    return waktu.replace(/^Pukul\s*/i, "");
}

export default function FormCatatKehadiran({
    open,
    onCloseAction,
    target,
    onSaveAction,
    initialValues,
    mode = "create",
}: {
    open: boolean;
    onCloseAction: () => void;
    target: PresensiManualTarget | null;
    onSaveAction: (payload: PresensiManualPayload) => void;
    initialValues?: PresensiManualInitialValues;
    mode?: "create" | "edit";
}) {
    const [status, setStatus] = useState<StatusKehadiran | null>(null);
    const [keterangan, setKeterangan] = useState("");
    const [reschedule, setReschedule] = useState(false);
    const [terapisBaru, setTerapisBaru] = useState("");
    const [tanggalBaru, setTanggalBaru] = useState("");
    const [jamMulaiBaru, setJamMulaiBaru] = useState("");
    const [jamSelesaiBaru, setJamSelesaiBaru] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset form setiap kali modal dibuka untuk target baru
    useEffect(() => {
        if (open) {
            setStatus(initialValues?.status ?? null);
            setKeterangan(initialValues?.keterangan ?? "");
            setReschedule(initialValues?.reschedule ?? false);
            setTerapisBaru(initialValues?.terapisBaru ?? target?.terapisName ?? "");
            setTanggalBaru(initialValues?.tanggalBaru ?? "");
            setJamMulaiBaru(initialValues?.jamMulaiBaru ?? "");
            setJamSelesaiBaru(initialValues?.jamSelesaiBaru ?? "");
            setErrors({});
        }
    }, [open, target?.id, target?.terapisName, initialValues]);

    if (!open || !target) return null;

    const butuhKeterangan = status !== null && status !== "Hadir";

    const handlePilihStatus = (value: StatusKehadiran) => {
        setStatus(value);
        setErrors((prev) => ({ ...prev, status: undefined }));

        // Kalau balik pilih "Hadir", reset field lanjutan
        if (value === "Hadir") {
            setKeterangan("");
            setReschedule(false);
            setTerapisBaru("");
            setTanggalBaru("");
            setJamMulaiBaru("");
            setJamSelesaiBaru("");
            setErrors({});
        }
    };

    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};

        if (!status) {
            newErrors.status = "Pilih status kehadiran terlebih dahulu";
            return newErrors;
        }

        if (butuhKeterangan && !keterangan.trim()) {
            newErrors.keterangan = "Keterangan wajib diisi";
        }

        if (reschedule) {
            if (!terapisBaru) newErrors.terapisBaru = "Pilih terapis untuk jadwal baru";
            if (!tanggalBaru) newErrors.tanggalBaru = "Tanggal baru wajib diisi";
            if (!jamMulaiBaru) newErrors.jamMulaiBaru = "Jam mulai wajib diisi";
            if (!jamSelesaiBaru) newErrors.jamSelesaiBaru = "Jam selesai wajib diisi";
            if (
                jamMulaiBaru &&
                jamSelesaiBaru &&
                jamMulaiBaru >= jamSelesaiBaru
            ) {
                newErrors.jamSelesaiBaru = "Jam selesai harus setelah jam mulai";
            }
        }

        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        onSaveAction({
            id: target.id,
            status: status as StatusKehadiran,
            keterangan: keterangan.trim(),
            reschedule,
            ...(reschedule
                ? { terapisBaru, tanggalBaru, jamMulaiBaru, jamSelesaiBaru }
                : {}),
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 flex items-center justify-center bg-[#1E5C58]/20 backdrop-blur-sm z-50 p-4">
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-visible relative max-h-[90vh] flex flex-col"
                >
                    <style
                        dangerouslySetInnerHTML={{
                            __html: `
            .scrollable-body::-webkit-scrollbar { width: 5px; }
            .scrollable-body::-webkit-scrollbar-track { background: transparent; }
            .scrollable-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .scrollable-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `,
                        }}
                    />

                    {/* Header */}
                    <div className="bg-linear-to-br from-[#1E5C58] to-[#2B7A75] px-6 py-4 text-white relative overflow-hidden shrink-0 rounded-t-3xl">
                        <div className="absolute top-0 right-0 z-0 w-32 h-32 transform translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-white/10 blur-2xl" />

                        <button
                            onClick={onCloseAction}
                            type="button"
                            className="cursor-pointer absolute right-4 top-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors z-20"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative z-10 flex items-center gap-2">
                            <Play className="w-4 h-4 fill-white" />
                            <h2 className="text-base font-bold">
                                {mode === "edit" ? "Edit Kehadiran" : "Catat Kehadiran"}
                            </h2>
                        </div>
                        <p className="relative z-10 mt-1 text-xs font-semibold text-white/80">
                            {target.pasienName} &bull; {target.tanggal} &bull;{" "}
                            {formatWaktuSingkat(target.waktu)}
                        </p>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-h-0 p-6 overflow-y-auto scrollable-body">
                        <form id="presensi-form" onSubmit={handleSubmit} className="space-y-4">
                            {/* Status Kehadiran */}
                            <div className="space-y-1.5">
                                <label className="ml-1 text-sm font-semibold text-gray-700">
                                    Status Kehadiran
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {statusOptions.map((value) => {
                                        const isActive = status === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => handlePilihStatus(value)}
                                                className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${isActive
                                                    ? "bg-[#E8F5F2] border-[#81B7A9] text-[#1E5C58] ring-2 ring-[#A2E4D3]"
                                                    : "bg-white border-gray-200 text-[#1E5C58] hover:border-teal-200 hover:bg-teal-50/30"
                                                    }`}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.status && (
                                    <p className="mt-1 text-xs font-medium text-red-500">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            {/* Field lanjutan: muncul kalau status bukan "Hadir" */}
                            <AnimatePresence initial={false}>
                                {butuhKeterangan && (
                                    <motion.div
                                        key="detail-fields"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        {/* Keterangan */}
                                        <div className="space-y-1.5">
                                            <label className="ml-1 text-sm font-semibold text-gray-700">
                                                Keterangan (alasan tidak hadir)
                                            </label>
                                            <textarea
                                                value={keterangan}
                                                onChange={(e) => {
                                                    setKeterangan(e.target.value);
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        keterangan: undefined,
                                                    }));
                                                }}
                                                rows={3}
                                                placeholder="Contoh: demam tinggi, ada acara keluarga, dll."
                                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm text-gray-700 font-medium resize-none ${errors.keterangan
                                                    ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                                                    : "border-gray-200 focus:border-[#2B7A75] focus:bg-white focus:ring-4 focus:ring-[#2B7A75]/10"
                                                    }`}
                                            />
                                            {errors.keterangan && (
                                                <p className="mt-1 text-xs font-medium text-red-500">
                                                    {errors.keterangan}
                                                </p>
                                            )}
                                        </div>

                                        {/* Reschedule toggle */}
                                        <label className="flex items-center gap-2.5 px-4 py-3 bg-teal-50/50 border border-teal-100 rounded-xl cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={reschedule}
                                                onChange={(e) => setReschedule(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#2B7A75] focus:ring-[#2B7A75]/30 cursor-pointer"
                                            />
                                            <CalendarClock className="w-4 h-4 text-[#2B7A75]" />
                                            <span className="text-sm font-semibold text-[#1E5C58]">
                                                Alihkan jadwal ini (Reschedule)
                                            </span>
                                        </label>

                                        {/* Field reschedule */}
                                        <AnimatePresence initial={false}>
                                            {reschedule && (
                                                <motion.div
                                                    key="reschedule-fields"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-visible"
                                                >
                                                    <div className="grid w-full min-w-0 grid-cols-2 gap-3 px-4 pt-1 pb-4 -mt-2 border border-teal-100 bg-teal-50/50 rounded-2xl">
                                                        <div className="space-y-1.5 min-w-0 col-span-2">
                                                            <label className="text-xs font-semibold text-gray-600 ml-0.5">
                                                                Terapis
                                                            </label>
                                                            <TerapisSelect
                                                                value={terapisBaru}
                                                                onChange={(value) => {
                                                                    setTerapisBaru(value);
                                                                    setErrors((prev) => ({
                                                                        ...prev,
                                                                        terapisBaru: undefined,
                                                                    }));
                                                                }}
                                                                hasError={Boolean(errors.terapisBaru)}
                                                                modalRef={modalRef}
                                                            />
                                                            {errors.terapisBaru && (
                                                                <p className="text-[10px] text-red-500 font-medium">
                                                                    {errors.terapisBaru}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5 min-w-0 w-full">
                                                            <label className="text-xs font-semibold text-gray-600 ml-0.5">
                                                                Tanggal Baru
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={tanggalBaru}
                                                                onChange={(e) => {
                                                                    setTanggalBaru(e.target.value);
                                                                    setErrors((prev) => ({
                                                                        ...prev,
                                                                        tanggalBaru: undefined,
                                                                    }));
                                                                }}
                                                                className={`w-full px-3 py-2 bg-white border rounded-lg outline-none text-xs font-medium text-gray-700 ${errors.tanggalBaru
                                                                    ? "border-red-300"
                                                                    : "border-gray-200 focus:border-[#2B7A75]"
                                                                    }`}
                                                            />
                                                            {errors.tanggalBaru && (
                                                                <p className="text-[10px] text-red-500 font-medium">
                                                                    {errors.tanggalBaru}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5 min-w-0 w-full">
                                                            <label className="text-xs font-semibold text-gray-600 ml-0.5">
                                                                Jam Baru
                                                            </label>
                                                            <div className="flex items-center w-full min-w-0 gap-1.5">
                                                                <input
                                                                    type="time"
                                                                    value={jamMulaiBaru}
                                                                    onChange={(e) => {
                                                                        setJamMulaiBaru(e.target.value);
                                                                        setErrors((prev) => ({
                                                                            ...prev,
                                                                            jamMulaiBaru: undefined,
                                                                        }));
                                                                    }}
                                                                    className={`w-full min-w-0 px-2 py-2 bg-white border rounded-lg outline-none text-xs font-medium text-gray-700 ${errors.jamMulaiBaru
                                                                        ? "border-red-300"
                                                                        : "border-gray-200 focus:border-[#2B7A75]"
                                                                        }`}
                                                                />
                                                                <span className="text-xs text-gray-400">
                                                                    &ndash;
                                                                </span>
                                                                <input
                                                                    type="time"
                                                                    value={jamSelesaiBaru}
                                                                    onChange={(e) => {
                                                                        setJamSelesaiBaru(e.target.value);
                                                                        setErrors((prev) => ({
                                                                            ...prev,
                                                                            jamSelesaiBaru: undefined,
                                                                        }));
                                                                    }}
                                                                    className={`w-full min-w-0 px-2 py-2 bg-white border rounded-lg outline-none text-xs font-medium text-gray-700 ${errors.jamSelesaiBaru
                                                                        ? "border-red-300"
                                                                        : "border-gray-200 focus:border-[#2B7A75]"
                                                                        }`}
                                                                />
                                                            </div>
                                                            {(errors.jamMulaiBaru || errors.jamSelesaiBaru) && (
                                                                <p className="text-[10px] text-red-500 font-medium">
                                                                    {errors.jamMulaiBaru || errors.jamSelesaiBaru}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </form>
                    </div>

                    {/* Footer aksi tetap di bawah modal */}
                    <div className="flex justify-end gap-3 px-6 py-4 bg-white border-t border-gray-100 rounded-b-3xl shrink-0">
                        <button
                            type="button"
                            onClick={onCloseAction}
                            className="cursor-pointer px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="presensi-form"
                            className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#1E5C58] text-white font-bold hover:bg-[#164945] shadow-md shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {mode === "edit" ? "Simpan Perubahan" : "Simpan Presensi"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
