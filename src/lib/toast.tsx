import React from "react";
import toast from "react-hot-toast";

/**
 * Standard Toast Notification System for Puspa Holistic
 */

export function showSuccessToast(message: string, title = "Berhasil") {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white border border-emerald-100/80 rounded-2xl shadow-[0_12px_30px_-5px_rgba(16,185,129,0.15)] pointer-events-auto flex items-center justify-between p-4 relative transition-all duration-300`}
      >
        <div className="flex gap-3 items-center flex-1 pr-3">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-emerald-100">
            <svg
              className="w-5 h-5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              ></path>
            </svg>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-extrabold text-[#1E5C58] tracking-tight">{title}</span>
            <span className="text-xs font-semibold text-gray-600 leading-relaxed">{message}</span>
          </div>
        </div>

        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/60 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 focus:outline-none"
        >
          <svg
            className="w-4 h-4 stroke-[2.5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    ),
    {
      duration: 4000,
    }
  );
}

export function showErrorToast(message: string, title = "Gagal") {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white border border-rose-100/80 rounded-2xl shadow-[0_12px_30px_-5px_rgba(244,63,94,0.15)] pointer-events-auto flex items-center justify-between p-4 relative transition-all duration-300`}
      >
        <div className="flex gap-3 items-center flex-1 pr-3">
          <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-rose-100">
            <svg
              className="w-5 h-5 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              ></path>
            </svg>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-extrabold text-rose-700 tracking-tight">{title}</span>
            <span className="text-xs font-semibold text-gray-700 leading-relaxed">{message}</span>
          </div>
        </div>

        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/60 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 focus:outline-none"
        >
          <svg
            className="w-4 h-4 stroke-[2.5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    ),
    {
      duration: 5000,
    }
  );
}

export function handleApiError(error: any, defaultMessage = "Terjadi kesalahan pada server") {
  let mainMessage = defaultMessage;
  let validationErrors: string[] = [];

  if (error?.response?.data) {
    const data = error.response.data;

    if (data.message) {
      mainMessage = data.message;
    }

    if (data.errors && typeof data.errors === "object") {
      Object.keys(data.errors).forEach((key) => {
        const fieldErrors = data.errors[key];
        if (Array.isArray(fieldErrors)) {
          validationErrors.push(...fieldErrors);
        } else if (typeof fieldErrors === "string") {
          validationErrors.push(fieldErrors);
        }
      });
    }
  } else if (error?.message) {
    mainMessage = error.message;
  }

  showErrorToast(
    validationErrors.length > 0
      ? `${mainMessage}: ${validationErrors.join(", ")}`
      : mainMessage,
    "Terjadi Kesalahan"
  );

  return mainMessage;
}
