/**
 * Centralized TanStack Query Keys Factory
 * Puspa Holistic Integrative Care
 */

export const queryKeys = {
  // --- Modul Auth & Profil ---
  auth: {
    me: ['auth', 'me'] as const,
  },
  profile: {
    admin: ['profile', 'admin'] as const,
    terapis: ['profile', 'terapis'] as const,
    ortu: ['profile', 'ortu'] as const,
  },

  // --- Modul Master Data ---
  children: {
    all: ['children'] as const,
    list: (params?: any) => ['children', 'list', params] as const,
    detail: (id: string) => ['children', 'detail', id] as const,
    byParent: ['children', 'byParent'] as const,
  },
  therapists: {
    all: ['therapists'] as const,
    list: (params?: any) => ['therapists', 'list', params] as const,
    detail: (id: string) => ['therapists', 'detail', id] as const,
  },

  // --- Modul Presensi & Reschedule ---
  presensi: {
    all: ['presensi'] as const,
    today: (filters?: any) => ['presensi', 'today', filters] as const,
    rescheduled: (filters?: any) => ['presensi', 'rescheduled', filters] as const,
  },

  // --- Modul Jadwal Terapi & Sesi ---
  schedules: {
    all: ['schedules'] as const,
    list: (params?: any) => ['schedules', 'list', params] as const,
    detail: (id: string) => ['schedules', 'detail', id] as const,
    todayParent: ['schedules', 'todayParent'] as const,
    historyParent: ['schedules', 'historyParent'] as const,
  },

  // --- Modul Keuangan / Finance ---
  finance: {
    all: ['finance'] as const,
    invoices: (params?: any) => ['finance', 'invoices', params] as const,
    invoiceDetail: (id: string) => ['finance', 'invoice', id] as const,
    credits: (params?: any) => ['finance', 'credits', params] as const,
    childrenGuardians: ['finance', 'childrenGuardians'] as const,
  },

  // --- Modul Asesmen & Observasi ---
  assessments: {
    all: ['assessments'] as const,
    list: (status: string, filters?: any) => ['assessments', status, filters] as const,
    detail: (id: string | number) => ['assessments', 'detail', id] as const,
  },
  observations: {
    all: ['observations'] as const,
    list: (status: string, filters?: any) => ['observations', status, filters] as const,
    detail: (id: string | number) => ['observations', 'detail', id] as const,
  },

  // --- Modul Sekolah (School Portal) ---
  school: {
    all: ['school'] as const,
    dashboard: ['school', 'dashboard'] as const,
    students: (filters?: any) => ['school', 'students', filters] as const,
    studentDetail: (id: string) => ['school', 'student', id] as const,
    profile: ['school', 'profile'] as const,
  },
};
