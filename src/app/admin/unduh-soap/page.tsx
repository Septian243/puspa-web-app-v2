"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArchiveRestore, Check, ChevronDown, Printer, X } from "lucide-react";

type Period = "Harian" | "Mingguan" | "Bulanan" | "Custom";
type SoapRow = {
  id: number;
  child: string;
  therapist: string;
  therapy: string;
  date: string;
  time: string;
  diagnosis: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

const DUMMY_ROWS: SoapRow[] = [
  { id: 1, child: "Zefanya Lidia", therapist: "Alfian Baki", therapy: "Okupasi", date: "2026-05-07", time: "09.05", diagnosis: "Sensory Integration Disorder", subjective: "Anak lebih kooperatif.", objective: "Mampu mengikuti instruksi sederhana.", assessment: "Kemajuan baik.", plan: "Latihan koordinasi motorik." },
  { id: 2, child: "Zefanya Lidia", therapist: "Alfian Baki", therapy: "Okupasi", date: "2026-05-14", time: "09.10", diagnosis: "Sensory Integration Disorder", subjective: "Anak datang dalam kondisi baik.", objective: "Durasi fokus meningkat.", assessment: "Respons sensorik membaik.", plan: "Lanjutkan program terapi." },
  { id: 3, child: "Zefanya Lidia", therapist: "Alfian Baki", therapy: "Okupasi", date: "2026-05-21", time: "09.05", diagnosis: "Sensory Integration Disorder", subjective: "Tidak ada keluhan baru.", objective: "Menyelesaikan aktivitas dengan bantuan minimal.", assessment: "Progres positif.", plan: "Evaluasi pada sesi berikutnya." },
  { id: 4, child: "Rafa Pratama", therapist: "Nadia Putri", therapy: "Wicara", date: "2026-05-08", time: "10.00", diagnosis: "Speech Delay", subjective: "Orang tua melaporkan kosakata bertambah.", objective: "Mengucapkan 10 kata fungsional.", assessment: "Kemampuan ekspresif meningkat.", plan: "Stimulasi kosakata di rumah." },
  { id: 5, child: "Rafa Pratama", therapist: "Nadia Putri", therapy: "Wicara", date: "2026-05-22", time: "10.00", diagnosis: "Speech Delay", subjective: "Anak antusias mengikuti terapi.", objective: "Meniru frasa dua kata.", assessment: "Kemajuan sesuai target.", plan: "Latihan frasa sederhana." },
  { id: 6, child: "Alya Nirmala", therapist: "Bima Saputra", therapy: "Fisio", date: "2026-05-11", time: "13.30", diagnosis: "Motor Delay", subjective: "Tidur cukup dan aktif.", objective: "Keseimbangan berdiri meningkat.", assessment: "Kekuatan tungkai membaik.", plan: "Latihan berdiri 10 menit." },
];

function MultiSelect({ label, values, options, onChange }: { label: string; values: string[]; options: string[]; onChange: (value: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredOptions = options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));
  const text = values.length === 0 ? "" : values.length === 1 ? values[0] : `${values[0]} (+${values.length - 1} lainnya)`;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <label className="mb-1.5 block text-xs font-bold text-gray-500">{label}</label>
      <div className="relative flex items-center rounded-xl border border-teal-100 bg-white px-4 py-2.5 pr-11 text-sm font-medium text-gray-700 shadow-sm focus-within:border-[#2B7A75] focus-within:ring-2 focus-within:ring-[#2B7A75]/20">
        <input ref={inputRef} type="text" value={open ? search : text} onFocus={() => setOpen(true)} onChange={(event) => { setSearch(event.target.value); setOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); setSearch(""); } }} placeholder={open ? (values.length ? `${values.length} dipilih - cari...` : `Cari ${label.toLowerCase()}...`) : `Semua ${label.toLowerCase()}`} aria-label={`Pilih ${label.toLowerCase()}`} className="w-full bg-transparent p-0 text-sm outline-none placeholder:text-gray-400" />
        <button type="button" tabIndex={-1} onClick={() => { if (open) { setOpen(false); setSearch(""); } else { setOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); } }} className="absolute right-0 flex h-full items-center pr-3" aria-label={`${open ? "Tutup" : "Buka"} pilihan ${label.toLowerCase()}`}>
          {values.length > 0 && <span className="mr-1 rounded-full bg-[#2B7A75] px-1.5 py-0.5 text-[10px] font-bold text-white">{values.length}</span>}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && <div className="absolute left-0 right-0 z-40 mt-2 flex max-h-[250px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-[#F4F9F8]/60 px-3 py-2">
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onChange([])} className="text-xs font-bold text-[#1E5C58]">Semua {label.toLowerCase()}</button>
          {values.length > 0 && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onChange([])} className="text-[11px] font-bold text-red-500">Hapus Pilihan ({values.length})</button>}
        </div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
          {filteredOptions.map((option) => { const selected = values.includes(option); return <button key={option} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onChange(selected ? values.filter((item) => item !== option) : [...values, option])} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selected ? "bg-teal-50/70 font-bold text-[#1E5C58]" : "font-medium text-gray-700 hover:bg-gray-50"}`}><span className="flex items-center gap-2.5 truncate"><span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-[#2B7A75] bg-[#2B7A75]" : "border-gray-300 bg-white"}`}>{selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}</span><span className="truncate">{option}</span></span></button>; })}
          {filteredOptions.length === 0 && <p className="px-3 py-4 text-center text-xs text-gray-400">Data tidak ditemukan.</p>}
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50/50 px-3 py-2 text-[11px] font-medium text-gray-400"><span>{values.length === 0 ? "Semua dipilih" : `${values.length} dari ${options.length} dipilih`}</span><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setOpen(false); setSearch(""); }} className="font-bold text-[#2B7A75]">Tutup</button></div>
      </div>}
    </div>
  );
}

export default function AdminUnduhSoapPage() {
  const [children, setChildren] = useState<string[]>([]);
  const [therapists, setTherapists] = useState<string[]>([]);
  const [therapies, setTherapies] = useState<string[]>([]);
  const [period, setPeriod] = useState<Period>("Bulanan");
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [date, setDate] = useState("");
  const [week, setWeek] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const childOptions = useMemo(() => [...new Set(DUMMY_ROWS.map((row) => row.child))], []);
  const therapistOptions = useMemo(() => [...new Set(DUMMY_ROWS.map((row) => row.therapist))], []);
  const therapyOptions = useMemo(() => [...new Set(DUMMY_ROWS.map((row) => row.therapy))], []);
  const rows = useMemo(() => DUMMY_ROWS.filter((row) =>
    (children.length === 0 || children.includes(row.child)) &&
    (therapists.length === 0 || therapists.includes(row.therapist)) &&
    (therapies.length === 0 || therapies.includes(row.therapy)) &&
    (period !== "Harian" || !date || row.date === date) &&
    (period !== "Mingguan" || !week || (() => {
      const [year, weekNumber] = week.split("-W").map(Number);
      const selected = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const current = new Date(row.date);
      const diff = Math.floor((current.getTime() - selected.getTime()) / 86400000);
      return current.getFullYear() === year && diff >= 0 && diff < 7;
    })()) &&
    (period !== "Bulanan" || !month || row.date.startsWith(month)) &&
    (period !== "Custom" || ((!from || row.date >= from) && (!to || row.date <= to)))
  ), [children, therapists, therapies, period, date, week, month, from, to]);

  const reset = () => { setChildren([]); setTherapists([]); setTherapies([]); setPeriod("Bulanan"); setDate(""); setWeek(""); setMonth(currentMonth); setFrom(""); setTo(""); };
  const printRows = () => window.print();

  const periodLabel = period === "Harian" ? date : period === "Bulanan" ? month : period === "Custom" ? `${from || "..."} - ${to || "..."}` : week;
  const activeFilters = [
    ...children.map((item) => ({ label: `Anak: ${item}`, remove: () => setChildren((current) => current.filter((value) => value !== item)) })),
    ...therapists.map((item) => ({ label: `Terapis: ${item}`, remove: () => setTherapists((current) => current.filter((value) => value !== item)) })),
    ...therapies.map((item) => ({ label: `Jenis: ${item}`, remove: () => setTherapies((current) => current.filter((value) => value !== item)) })),
    ...(periodLabel ? [{ label: periodLabel, remove: () => { setDate(""); setWeek(""); setMonth(""); setFrom(""); setTo(""); } }] : []),
  ];

  return <div className="min-h-screen bg-[#F8FBFB] p-5 text-[#1E5C58] sm:p-8">
    <div className="mb-6"><div><h1 className="flex items-center gap-3 text-2xl font-bold"><ArchiveRestore className="h-7 w-7" /> <span>Unduh Rekap SOAP Terapi</span></h1><p className="mt-2 text-sm text-gray-500">Pilih anak, terapis, dan periode untuk mengunduh rekap catatan SOAP terapi.</p></div></div>
    <div className="overflow-hidden rounded-2xl border border-teal-50 bg-white shadow-sm">
      <div className="space-y-6 p-6"><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><MultiSelect label="Anak" values={children} options={childOptions} onChange={setChildren} /><MultiSelect label="Terapis" values={therapists} options={therapistOptions} onChange={setTherapists} /><MultiSelect label="Jenis Terapi" values={therapies} options={therapyOptions} onChange={setTherapies} /></div>
        <div><p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-gray-400">Periode</p><div className="flex flex-col gap-4 md:flex-row md:items-end"><div className="flex overflow-x-auto rounded-xl border border-teal-50 bg-[#F4F9F8] p-1">{(["Harian", "Mingguan", "Bulanan", "Custom"] as Period[]).map((item) => <button key={item} onClick={() => setPeriod(item)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all ${period === item ? "bg-[#1E5C58] text-white shadow-sm" : "text-gray-400 hover:text-[#2B7A75]"}`}>{item}</button>)}</div><div className="flex-1">{period === "Harian" && <div><label className="mb-1.5 block text-xs font-semibold text-gray-500">Tanggal</label><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm" /></div>}{period === "Mingguan" && <div><label className="mb-1.5 block text-xs font-semibold text-gray-500">Minggu</label><input type="week" value={week} onChange={(event) => setWeek(event.target.value)} className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm" /></div>}{period === "Bulanan" && <div><label className="mb-1.5 block text-xs font-semibold text-gray-500">Bulan</label><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm" /></div>}{period === "Custom" && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className="mb-1.5 block text-xs font-semibold text-gray-500">Dari</label><input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm" /></div><div><label className="mb-1.5 block text-xs font-semibold text-gray-500">Sampai</label><input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm" /></div></div>}</div></div></div>
      </div>
      <div className="flex flex-col justify-between gap-3 border-t border-gray-100 bg-gray-50/40 px-6 py-3 sm:flex-row sm:items-center"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="mr-1 text-sm font-bold text-gray-400">Aktif:</span>{activeFilters.map((item) => <span key={item.label} className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 pl-3 pr-1.5 py-1 font-bold text-[#1E5C58]">{item.label}<button type="button" onClick={item.remove} aria-label={`Hapus filter ${item.label}`} className="rounded-full p-0.5 hover:bg-teal-100"><X className="h-3 w-3" /></button></span>)}{activeFilters.length === 0 && <span className="text-sm font-medium text-gray-400">Belum ada filter</span>}</div><button onClick={reset} className="text-sm font-bold text-red-500">Reset</button></div>
      <div className="flex flex-col justify-between gap-3 border-t border-gray-100 bg-[#F4F9F8]/50 px-6 py-4 sm:flex-row sm:items-center"><p className="text-xs font-semibold text-gray-500">Mengekspor data SOAP mencakup kolom: <b className="text-[#1E5C58]">S, O, A, P.</b></p><div className="flex gap-3"><button onClick={printRows} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-xl border border-teal-100 bg-white px-5 py-2.5 text-sm font-bold text-[#1E5C58] disabled:opacity-50"><Printer className="h-4 w-4" /> Export PDF</button></div></div>
      <div className="border-t border-gray-100"><div className="flex items-center justify-between px-6 py-4"><h3 className="text-sm font-extrabold">Preview (10 baris pertama)</h3><span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-[11px] font-bold">Total: {rows.length} data</span></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-teal-50 bg-[#F4F9F8]">{["Anak", "Terapis", "Jenis Terapi", "Tanggal", "Jam", "Diagnosis"].map((title) => <th key={title} className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-wider">{title}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{rows.slice(0, 10).map((row) => <tr key={row.id} className="hover:bg-[#F4F9F8]/50"><td className="px-6 py-4 text-sm font-bold text-gray-800">{row.child}</td><td className="px-6 py-4 text-sm font-bold">{row.therapist}</td><td className="px-6 py-4"><span className="rounded-md border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-bold">{row.therapy.toLowerCase()}</span></td><td className="px-6 py-4 text-sm font-bold text-gray-800">{row.date}</td><td className="px-6 py-4 text-xs text-gray-400">{row.time}</td><td className="px-6 py-4 text-sm font-semibold text-gray-600">{row.diagnosis}</td></tr>)}{!rows.length && <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">Data tidak ditemukan sesuai filter.</td></tr>}</tbody></table></div></div>
    </div>
  </div>;
}
