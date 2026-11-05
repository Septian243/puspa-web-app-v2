"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────── TYPES ─────────────────────────── */

interface AdminRole {
  id: string;
  name: string;
  desc: string;
  checkedIds: string[];
}

interface MenuLeaf {
  id: string;
  label: string;
  wajib?: boolean;
}

interface MenuParent {
  id: string;
  label: string;
  childIds: string[];
  wajib?: boolean;
}

type MenuEntry =
  | { type: "leaf"; item: MenuLeaf }
  | { type: "parent"; item: MenuParent }
  | { type: "child"; item: MenuLeaf; parentId: string };

interface MenuSection {
  section: string;
  entries: MenuEntry[];
}

/* ─────────────────────── MENU DEFINITION ───────────────────── */

const ALL_LEAF_IDS = [
  "dashboard",
  "admin",
  "terapis",
  "pasien_anak",
  "observasi",
  "asesmen",
  "terapi_menu",
  "presensi",
  "laporan_soap",
  "keuangan",
  "ubah_profile",
  "ubah_password",
];

/** ID yang selalu aktif dan tidak bisa di-toggle oleh user */
const WAJIB_IDS = ["dashboard", "ubah_profile", "ubah_password"];

const MENU_SECTIONS: MenuSection[] = [
  {
    section: "UMUM",
    entries: [
      { type: "leaf", item: { id: "dashboard", label: "Dashboard", wajib: true } },
    ],
  },
  {
    section: "MANAJEMEN DATA",
    entries: [
      { type: "leaf", item: { id: "admin", label: "Admin" } },
      { type: "leaf", item: { id: "terapis", label: "Terapis" } },
      { type: "leaf", item: { id: "pasien_anak", label: "Pasien / Anak" } },
      {
        type: "parent",
        item: { id: "jadwal", label: "Jadwal", childIds: ["observasi", "asesmen", "terapi_menu"] },
      },
      { type: "child", item: { id: "observasi", label: "Observasi" }, parentId: "jadwal" },
      { type: "child", item: { id: "asesmen", label: "Asesmen" }, parentId: "jadwal" },
      { type: "child", item: { id: "terapi_menu", label: "Terapi" }, parentId: "jadwal" },
      { type: "leaf", item: { id: "presensi", label: "Presensi" } },
      { type: "leaf", item: { id: "laporan_soap", label: "Laporan SOAP" } },
      { type: "leaf", item: { id: "keuangan", label: "Keuangan" } },
    ],
  },
  {
    section: "KELOLA AKUN",
    entries: [
      {
        type: "parent",
        item: { id: "pengaturan", label: "Pengaturan", childIds: ["ubah_profile", "ubah_password"], wajib: true },
      },
      { type: "child", item: { id: "ubah_profile", label: "Ubah Profile", wajib: true }, parentId: "pengaturan" },
      { type: "child", item: { id: "ubah_password", label: "Ubah Password", wajib: true }, parentId: "pengaturan" },
    ],
  },
];

/* ─────────────────────── INITIAL MOCK DATA ─────────────────── */

const INITIAL_ROLES: AdminRole[] = [
  {
    id: "keuangan",
    name: "Admin Keuangan",
    desc: "Mengelola tagihan, pembayaran, dan pengembalian dana pasien.",
    checkedIds: ["dashboard", "admin", "keuangan", "ubah_profile", "ubah_password"],
  },
  {
    id: "presensi",
    name: "Admin Presensi",
    desc: "Mengelola kehadiran terapi serta pencatatan izin, sakit, dan tidak hadir.",
    checkedIds: ["dashboard", "terapis", "pasien_anak", "presensi", "ubah_profile", "ubah_password"],
  },
  {
    id: "layanan",
    name: "Admin Layanan",
    desc: "Mengelola jadwal observasi, asesmen, dan terapi pasien.",
    checkedIds: [
      "dashboard",
      "terapis",
      "pasien_anak",
      "observasi",
      "asesmen",
      "terapi_menu",
      "laporan_soap",
      "ubah_profile",
      "ubah_password",
    ],
  },
];

/* ─────────────────────── HELPERS ───────────────────────────── */

function countChecked(checkedIds: string[]): number {
  return checkedIds.filter((id) => ALL_LEAF_IDS.includes(id)).length;
}

function isParentChecked(parentChildIds: string[], checkedIds: string[]): boolean {
  return parentChildIds.every((cid) => checkedIds.includes(cid));
}

function isParentIndeterminate(parentChildIds: string[], checkedIds: string[]): boolean {
  const some = parentChildIds.some((cid) => checkedIds.includes(cid));
  const all = parentChildIds.every((cid) => checkedIds.includes(cid));
  return some && !all;
}

/* ─────────────────────── CHECKBOX COMPONENT ─────────────────── */

function TealCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0
        ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
        ${checked || indeterminate
          ? "bg-[#2B7A75] border-[#2B7A75]"
          : "bg-white border-gray-300 hover:border-[#2B7A75]"
        }`}
    >
      {checked && !indeterminate && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && (
        <div className="w-2.5 h-0.5 bg-white rounded-full" />
      )}
    </button>
  );
}

/* ─────────────────────── TOAST COMPONENT ───────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 right-6 z-[200] bg-[#1E5C58] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-3"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="9" fill="white" fillOpacity="0.2" />
        <path d="M5 9L7.5 11.5L13 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </motion.div>
  );
}

/* ─────────────────────── MAIN PAGE ─────────────────────────── */

export default function HakAksesPage() {
  const [roles, setRoles] = useState<AdminRole[]>(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(INITIAL_ROLES[2].id);

  /* Editing state — synced from selected role */
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0];
  const [editName, setEditName] = useState(selectedRole.name);
  const [editDesc, setEditDesc] = useState(selectedRole.desc);
  const [editCheckedIds, setEditCheckedIds] = useState<string[]>(selectedRole.checkedIds);
  const [isDirty, setIsDirty] = useState(false);

  /* Modal state */
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [nameError, setNameError] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* ── select a role (save-guard: reset edit state) */
  function selectRole(roleId: string) {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    setSelectedRoleId(roleId);
    setEditName(role.name);
    setEditDesc(role.desc);
    setEditCheckedIds(role.checkedIds);
    setIsDirty(false);
  }

  /* ── toggle leaf */
  function toggleLeaf(id: string) {
    if (WAJIB_IDS.includes(id)) return; // wajib, tidak bisa di-toggle
    setEditCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setIsDirty(true);
      return next;
    });
  }

  /* ── toggle parent (toggle all children) */
  function toggleParent(childIds: string[]) {
    // Jika semua child-nya adalah wajib, tidak bisa di-toggle
    if (childIds.every((cid) => WAJIB_IDS.includes(cid))) return;
    const toggleableChildren = childIds.filter((cid) => !WAJIB_IDS.includes(cid));
    const allChecked = toggleableChildren.every((cid) => editCheckedIds.includes(cid));
    setEditCheckedIds((prev) => {
      const without = prev.filter((x) => !toggleableChildren.includes(x));
      const next = allChecked ? without : [...without, ...toggleableChildren];
      setIsDirty(true);
      return next;
    });
  }

  /* ── pilih semua */
  function selectAll() {
    setEditCheckedIds(ALL_LEAF_IDS);
    setIsDirty(true);
  }

  /* ── kosongkan (keep semua wajib) */
  function clearAll() {
    setEditCheckedIds(WAJIB_IDS);
    setIsDirty(true);
  }

  /* ── simpan */
  function handleSave() {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRoleId
          ? { ...r, name: editName, desc: editDesc, checkedIds: editCheckedIds }
          : r
      )
    );
    setIsDirty(false);
    showToast("Hak akses berhasil disimpan.");
  }

  /* ── batalkan edit */
  function handleCancel() {
    selectRole(selectedRoleId);
  }

  /* ── add new role */
  function handleAddRole() {
    if (!newName.trim()) {
      setNameError(true);
      return;
    }
    const newId = `role_${Date.now()}`;
    const newRole: AdminRole = {
      id: newId,
      name: newName.trim(),
      desc: newDesc.trim(),
      checkedIds: [...WAJIB_IDS],
    };
    setRoles((prev) => [...prev, newRole]);
    setShowAddModal(false);
    setNewName("");
    setNewDesc("");
    setNameError(false);
    selectRole(newId);
    // need to set state after selectRole re-renders
    setTimeout(() => {
      setSelectedRoleId(newId);
      setEditName(newRole.name);
      setEditDesc(newRole.desc);
      setEditCheckedIds(newRole.checkedIds);
    }, 0);
    showToast(`Jenis admin "${newRole.name}" berhasil dibuat.`);
  }

  /* ── delete role */
  function handleDeleteRole() {
    const remaining = roles.filter((r) => r.id !== selectedRoleId);
    setRoles(remaining);
    setShowDeleteModal(false);
    if (remaining.length > 0) {
      selectRole(remaining[0].id);
    }
    showToast("Jenis admin berhasil dihapus.");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const checkedCount = countChecked(editCheckedIds);

  return (
    <div className="flex flex-col h-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col px-8 pt-8 pb-0 gap-6 h-full overflow-hidden">
        {/* Title row */}
        <div className="flex items-start justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight">
              Manajemen Hak Akses
            </h1>
            <p className="text-sm text-gray-400 font-medium mt-0.5">
              Buat jenis admin dan ceklis menu yang dapat diakses oleh masing-masing jenis admin.
            </p>
          </div>
          <button
            onClick={() => {
              setNewName("");
              setNewDesc("");
              setNameError(false);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-[#1E5C58] hover:bg-[#174d49] text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-md shadow-teal-900/20 transition-all active:scale-95 shrink-0"
          >
            <Plus size={16} strokeWidth={3} />
            Jenis Admin Baru
          </button>
        </div>

        {/* Two-column section */}
        <div className="flex gap-6 flex-1 min-h-0 overflow-hidden pb-8">
          {/* ── Left Panel: Role List ── */}
          <div className="w-64 shrink-0 overflow-y-auto space-y-2 pr-1">
            {roles.map((role) => {
              const isActive = role.id === selectedRoleId;
              return (
                <button
                  key={role.id}
                  onClick={() => selectRole(role.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-200
                    ${isActive
                      ? "bg-white border-[#2B7A75] shadow-sm"
                      : "bg-white border-gray-100 hover:border-[#2B7A75]/40 hover:shadow-sm"
                    }`}
                >
                  <p className={`text-sm font-bold ${isActive ? "text-[#1E5C58]" : "text-gray-700"}`}>
                    {role.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {countChecked(role.checkedIds)} dari 12 menu
                  </p>
                </button>
              );
            })}
          </div>

          {/* ── Right Panel: Editor ── */}
          <div className="flex-1 bg-white rounded-3xl border border-teal-50 shadow-sm overflow-hidden flex flex-col">
            {/* Top fields */}
            <div className="px-6 pt-6 pb-4 shrink-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Nama Jenis Admin
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); setIsDirty(true); }}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#2B7A75] focus:ring-2 focus:ring-[#2B7A75]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => { setEditDesc(e.target.value); setIsDirty(true); }}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#2B7A75] focus:ring-2 focus:ring-[#2B7A75]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Menu header */}
            <div className="flex items-center justify-between px-6 py-2.5 border-t border-b border-gray-100 shrink-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Menu yang Dapat Diakses · {checkedCount} dari 12 Menu
              </span>
              <div className="flex items-center gap-3 text-xs font-bold text-[#2B7A75]">
                <button onClick={selectAll} className="hover:underline transition-all">
                  Pilih semua
                </button>
                <span className="text-gray-300">·</span>
                <button onClick={clearAll} className="hover:underline transition-all">
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Menu tree (scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {MENU_SECTIONS.map((sec) => (
                <div key={sec.section}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    {sec.section}
                  </p>
                  <div className="space-y-2">
                    {sec.entries.map((entry) => {
                      if (entry.type === "leaf") {
                        const { item } = entry;
                        const isChecked = editCheckedIds.includes(item.id);
                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            <TealCheckbox
                              checked={isChecked}
                              onChange={() => toggleLeaf(item.id)}
                              disabled={item.wajib}
                            />
                            <span className="text-sm font-semibold text-gray-700">
                              {item.label}
                            </span>
                            {item.wajib && (
                              <span className="text-[10px] font-bold text-[#2B7A75] bg-teal-50 px-2 py-0.5 rounded-full">
                                wajib
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (entry.type === "parent") {
                        const { item } = entry;
                        const allChecked = isParentChecked(item.childIds, editCheckedIds);
                        const indeterminate = isParentIndeterminate(item.childIds, editCheckedIds);
                        const isWajib = !!item.wajib;
                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            <TealCheckbox
                              checked={allChecked}
                              indeterminate={!isWajib && indeterminate}
                              onChange={() => toggleParent(item.childIds)}
                              disabled={isWajib}
                            />
                            <span className="text-sm font-semibold text-gray-700">
                              {item.label}
                            </span>
                            {isWajib && (
                              <span className="text-[10px] font-bold text-[#2B7A75] bg-teal-50 px-2 py-0.5 rounded-full">
                                wajib
                              </span>
                            )}
                          </div>
                        );
                      }

                      /* child */
                      const { item } = entry;
                      const isChecked = editCheckedIds.includes(item.id);
                      return (
                        <div key={item.id} className="flex items-center gap-3 pl-8">
                          <TealCheckbox
                            checked={isChecked}
                            onChange={() => toggleLeaf(item.id)}
                            disabled={item.wajib}
                          />
                          <span className="text-sm text-gray-600 font-medium">
                            {item.label}
                          </span>
                          {item.wajib && (
                            <span className="text-[10px] font-bold text-[#2B7A75] bg-teal-50 px-2 py-0.5 rounded-full">
                              wajib
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / Actions */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-sm font-bold text-rose-500 hover:bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl transition-all active:scale-95"
              >
                Hapus jenis admin
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  disabled={!isDirty}
                  className="text-sm font-bold text-gray-500 hover:text-gray-700 disabled:opacity-40 px-4 py-2.5 rounded-xl transition-all"
                >
                  Batalkan
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className="text-sm font-bold text-white bg-[#1E5C58] hover:bg-[#174d49] disabled:opacity-40 px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Simpan hak akses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ ADD MODAL ══════════════ */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-[#1E5C58] px-6 py-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    Jenis Admin Baru
                  </h3>
                  <p className="text-sm text-white/70 mt-0.5">
                    Menu dapat diatur setelah jenis admin dibuat
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/60 hover:text-white p-1 rounded-lg transition-colors mt-0.5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Nama Jenis Admin
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    placeholder="Contoh: Admin Keuangan"
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all
                      ${nameError
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                        : "border-gray-200 focus:border-[#2B7A75] focus:ring-[#2B7A75]/10"
                      }`}
                  />
                  {nameError && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">
                      Nama jenis admin wajib diisi.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Deskripsi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Tugas utama jenis admin ini"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-[#2B7A75] focus:ring-2 focus:ring-[#2B7A75]/10 transition-all"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 pb-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddRole}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#1E5C58] hover:bg-[#174d49] rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Buat jenis admin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════ DELETE MODAL ══════════════ */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-[#1E5C58] px-6 py-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    Hapus Jenis Admin
                  </h3>
                  <p className="text-sm text-white/70 mt-0.5">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-white/60 hover:text-white p-1 rounded-lg transition-colors mt-0.5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Jenis admin{" "}
                  <span className="font-bold text-gray-900">{selectedRole.name}</span>{" "}
                  akan dihapus beserta pengaturan hak aksesnya.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 pb-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteRole}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#D92D20] hover:bg-[#b91c1c] rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Ya, hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════ TOAST ══════════════ */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
