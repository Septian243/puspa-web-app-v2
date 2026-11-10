"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  GraduationCap,
  MapPin,
  User,
  Mail,
  Phone,
  ShieldPlus,
  Edit3,
  X,
  CheckCircle2,
  LockKeyhole,
  Eye,
  EyeOff,
  ChevronDown,
  UserCog,
} from "lucide-react";
import { Sekolah } from "@/lib/api/data_sekolah";

export type FormSekolahState = {
  nama: string;
  jenjang: string;
  alamat: string;
  username: string;
  email: string;
  telepon: string;
  password?: string;
};

interface FormSekolahProps {
  open: boolean;
  mode: "tambah" | "ubah";
  onClose: () => void;
  onSubmit: (data: FormSekolahState) => void;
  initialData?: Sekolah | null;
}

type FormErrors = Partial<Record<keyof FormSekolahState, string>>;

const jenjangPilihan = [
  "PAUD",
  "TK",
  "SD",
  "SMP",
  "SMA",
  "SMK",
  "SLB",
];

export default function FormSekolah({
  open,
  mode,
  onClose,
  onSubmit,
  initialData,
}: FormSekolahProps) {
  const isEdit = mode === "ubah";

  const [form, setForm] = useState<FormSekolahState>({
    nama: "",
    jenjang: "",
    alamat: "",
    username: "",
    email: "",
    telepon: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Sinkronkan data saat modal dibuka
  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        // Cocokkan jenjang dengan daftar pilihan singkatan tanpa tanda kurung ()
        const cleanJenjang = (initialData.jenjang || "").split(" (")[0].trim();
        const found = jenjangPilihan.find(
          (j) =>
            j.toLowerCase() === cleanJenjang.toLowerCase() ||
            j.toLowerCase().includes(cleanJenjang.toLowerCase()),
        );
        const matchedJenjang = found || cleanJenjang;

        setForm({
          nama: initialData.nama || "",
          jenjang: matchedJenjang,
          alamat: initialData.alamat || "Jl. Veteran No. 12, Jamsaren, Kediri",
          username: initialData.username || "",
          email: initialData.email || "",
          telepon: initialData.phone || "",
          password: "",
        });
      } else {
        // Mode tambah: kosongkan form
        setForm({
          nama: "",
          jenjang: "",
          alamat: "",
          username: "",
          email: "",
          telepon: "",
          password: "",
        });
      }
      setErrors({});
      setShowPassword(false);
    }
  }, [open, isEdit, initialData]);

  if (!open) return null;

  // ================= VALIDASI =================
  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!form.nama.trim()) {
      newErrors.nama = "Nama sekolah wajib diisi";
    }

    if (!form.jenjang.trim()) {
      newErrors.jenjang = "Jenjang sekolah wajib dipilih";
    }

    if (!form.alamat.trim()) {
      newErrors.alamat = "Alamat sekolah wajib diisi";
    }

    if (!form.username.trim()) {
      newErrors.username = "Nama pengguna wajib diisi";
    } else if (/\s/.test(form.username)) {
      newErrors.username = "Nama pengguna tidak boleh mengandung spasi";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!form.telepon.trim()) {
      newErrors.telepon = "Nomor telepon wajib diisi";
    } else if (!/^[0-9]+$/.test(form.telepon)) {
      newErrors.telepon = "Nomor telepon hanya boleh angka";
    } else if (form.telepon.length < 8) {
      newErrors.telepon = "Nomor telepon minimal 8 digit";
    }

    // Validasi password hanya wajib pada mode tambah
    if (!isEdit) {
      if (!form.password || !form.password.trim()) {
        newErrors.password = "Password wajib diisi";
      } else if (form.password.length < 8) {
        newErrors.password = "Password minimal 8 karakter";
      } else if (!/[A-Z]/.test(form.password)) {
        newErrors.password = "Password harus mengandung 1 huruf kapital";
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
        newErrors.password = "Password harus mengandung 1 simbol";
      }
    }

    return newErrors;
  };

  // ================= SUBMIT =================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    onSubmit(form);
  };

  // Styling dinamis berdasarkan mode (Tambah: Toska | Ubah: Amber)
  const headerGradient = isEdit
    ? "from-amber-500 to-amber-600"
    : "from-[#1E5C58] to-[#2B7A75]";
  const focusBorderColor = isEdit
    ? "focus:border-amber-500 focus:ring-amber-500/10"
    : "focus:border-[#2B7A75] focus:ring-[#2B7A75]/10";
  const iconFocusColor = isEdit
    ? "group-focus-within:text-amber-500"
    : "group-focus-within:text-[#2B7A75]";
  const submitButtonClass = isEdit
    ? "bg-amber-500 hover:bg-amber-600"
    : "bg-[#1E5C58] hover:bg-[#164340]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center bg-[#1E5C58]/20 backdrop-blur-sm z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative max-h-[92vh] flex flex-col"
        >
          {/* Header Modal */}
          <div
            className={`bg-gradient-to-br ${headerGradient} p-6 text-white relative overflow-hidden shrink-0 transition-colors duration-300`}
          >
            <div className="absolute top-0 right-0 z-0 w-32 h-32 transform translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-white/10 blur-2xl" />

            <button
              onClick={onClose}
              type="button"
              className="cursor-pointer absolute right-4 top-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 text-white border bg-white/20 rounded-2xl backdrop-blur-md border-white/30 shrink-0">
                {isEdit ? (
                  <Edit3 className="w-6 h-6" />
                ) : (
                  <ShieldPlus className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEdit ? "Ubah Data Sekolah" : "Tambah Data Sekolah"}
                </h2>
                <div className="text-xs font-semibold text-white/80 mt-1 flex items-center gap-1.5">
                  {isEdit ? (
                    <>
                      <UserCog className="w-3.5 h-3.5" /> @
                      {initialData?.username || form.username}
                    </>
                  ) : (
                    "Registrasi akun sekolah baru"
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 p-6 space-y-4 overflow-y-auto"
          >
            {/* 1. Nama Sekolah */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Nama Sekolah
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Home
                    className={`h-5 w-5 transition-colors ${errors.nama ? "text-red-400" : `text-gray-400 ${iconFocusColor}`
                      }`}
                  />
                </div>
                <input
                  type="text"
                  placeholder="SD 1 Jamsaren"
                  value={form.nama}
                  onChange={(e) =>
                    setForm({ ...form, nama: e.target.value })
                  }
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm text-gray-700 font-medium ${errors.nama
                      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : `border-gray-200 focus:bg-white focus:ring-4 ${focusBorderColor}`
                    }`}
                />
              </div>
              {errors.nama && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.nama}
                </p>
              )}
            </div>

            {/* 2. Jenjang */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Jenjang
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <GraduationCap
                    className={`h-5 w-5 transition-colors ${errors.jenjang ? "text-red-400" : `text-gray-400 ${iconFocusColor}`
                      }`}
                  />
                </div>
                <select
                  name="jenjang"
                  value={form.jenjang}
                  onChange={(e) =>
                    setForm({ ...form, jenjang: e.target.value })
                  }
                  className={`appearance-none cursor-pointer w-full pl-11 pr-10 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm font-medium ${form.jenjang ? "text-gray-700" : "text-gray-400"
                    } ${errors.jenjang
                      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : `border-gray-200 focus:bg-white focus:ring-4 ${focusBorderColor}`
                    }`}
                >
                  <option value="" disabled className="text-gray-400">
                    Pilih Jenjang
                  </option>
                  {jenjangPilihan.map((j) => (
                    <option key={j} value={j} className="text-gray-700">
                      {j}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {errors.jenjang && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.jenjang}
                </p>
              )}
            </div>

            {/* 3. Alamat */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Alamat
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin
                    className={`h-5 w-5 transition-colors ${errors.alamat ? "text-red-400" : `text-gray-400 ${iconFocusColor}`
                      }`}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Isikan alamat"
                  value={form.alamat}
                  onChange={(e) =>
                    setForm({ ...form, alamat: e.target.value })
                  }
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm text-gray-700 font-medium ${errors.alamat
                      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : `border-gray-200 focus:bg-white focus:ring-4 ${focusBorderColor}`
                    }`}
                />
              </div>
              {errors.alamat && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.alamat}
                </p>
              )}
            </div>

            {/* 4. Nama Pengguna */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Nama Pengguna
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User
                    className={`h-5 w-5 transition-colors ${errors.username ? "text-red-400" : `text-gray-400 ${iconFocusColor}`
                      }`}
                  />
                </div>
                <input
                  type="text"
                  placeholder="jamsaren01"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm text-gray-700 font-medium ${errors.username
                      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : `border-gray-200 focus:bg-white focus:ring-4 ${focusBorderColor}`
                    }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.username}
                </p>
              )}
            </div>

            {/* 5. Email */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail
                    className={`h-5 w-5 transition-colors ${errors.email ? "text-red-400" : `text-gray-400 ${iconFocusColor}`
                      }`}
                  />
                </div>
                <input
                  type="email"
                  placeholder="jamsaren@gmail.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm text-gray-700 font-medium ${errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : `border-gray-200 focus:bg-white focus:ring-4 ${focusBorderColor}`
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* 6. Telepon */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Telepon
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone
                    className={`h-5 w-5 transition-colors ${errors.telepon ? "text-red-400" : `text-gray-400 ${iconFocusColor}`
                      }`}
                  />
                </div>
                <input
                  type="tel"
                  placeholder="628956567878980"
                  value={form.telepon}
                  onChange={(e) =>
                    setForm({ ...form, telepon: e.target.value })
                  }
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm text-gray-700 font-medium ${errors.telepon
                      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : `border-gray-200 focus:bg-white focus:ring-4 ${focusBorderColor}`
                    }`}
                />
              </div>
              {errors.telepon && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.telepon}
                </p>
              )}
            </div>

            {/* 7. Password (Hanya muncul saat mode Tambah) */}
            {!isEdit && (
              <div className="space-y-1.5">
                <label className="ml-1 text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LockKeyhole
                      className={`h-5 w-5 transition-colors ${errors.password
                          ? "text-red-400"
                          : "text-gray-400 group-focus-within:text-[#2B7A75]"
                        }`}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={`w-full pl-11 pr-11 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm text-gray-700 font-medium ${errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                        : "border-gray-200 focus:border-[#2B7A75] focus:bg-white focus:ring-4 focus:ring-[#2B7A75]/10"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className={`cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-xl ${submitButtonClass} text-white font-semibold text-sm transition-all shadow-md active:scale-95`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isEdit ? "Simpan Perubahan" : "Simpan Sekolah"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

