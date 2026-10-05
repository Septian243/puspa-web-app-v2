"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Printer, Copy, Check } from "lucide-react";
import { showSuccessToast } from "@/lib/toast";

interface QrCodeViewerModalProps {
  open: boolean;
  onClose: () => void;
  sessionData: {
    sessionId: string;
    childName: string;
    medicalRecordNumber: string;
    therapyType: string;
    therapistName: string;
    sessionDate: string;
    sessionTime: string;
    attendanceToken: string;
  } | null;
}

export default function QrCodeViewerModal({
  open,
  onClose,
  sessionData,
}: QrCodeViewerModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!open || !sessionData) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    sessionData.attendanceToken
  )}`;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(sessionData.attendanceToken);
    setCopied(true);
    showSuccessToast("Token QR berhasil disalin!", "Disalin");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Presensi - ${sessionData.childName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 30px; }
            .card { border: 2px solid #1E5C58; border-radius: 16px; padding: 20px; max-width: 320px; margin: 0 auto; }
            h2 { color: #1E5C58; margin-bottom: 4px; font-size: 18px; }
            p { margin: 4px 0; color: #555; font-size: 12px; }
            img { margin: 15px 0; width: 200px; height: 200px; }
            .rm { background: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>PUSPA HOLISTIC</h2>
            <p>Kartu Presensi Terapi Anak</p>
            <img src="${qrUrl}" alt="QR Code" />
            <h3 style="margin: 6px 0;">${sessionData.childName}</h3>
            <span class="rm">No. RM: ${sessionData.medicalRecordNumber}</span>
            <p style="margin-top: 10px;"><b>${sessionData.therapyType}</b> • ${sessionData.sessionTime}</p>
            <p>Terapis: ${sessionData.therapistName}</p>
            <p style="font-size: 10px; color: #888;">Tanggal: ${sessionData.sessionDate}</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#1E5C58]/25 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-sm overflow-hidden bg-white shadow-2xl rounded-3xl border border-teal-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 text-white bg-linear-to-r from-[#1E5C58] to-[#2B7A75]">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-300" />
              <h3 className="text-base font-extrabold tracking-tight">
                QR Code Presensi Sesi
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 text-center space-y-4">
            <div>
              <h4 className="text-base font-extrabold text-gray-800">
                {sessionData.childName}
              </h4>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">
                No. RM:{" "}
                <span className="text-[#1E5C58] font-bold">
                  {sessionData.medicalRecordNumber}
                </span>
              </p>
            </div>

            {/* QR Image Box */}
            <div className="relative inline-block p-4 bg-teal-50/50 border-2 border-dashed border-[#2B7A75]/30 rounded-2xl">
              <img
                src={qrUrl}
                alt={`QR Code Presensi ${sessionData.childName}`}
                className="w-48 h-48 mx-auto object-contain rounded-lg shadow-xs"
              />
              <span className="block mt-2 text-[10px] font-bold text-[#1E5C58] uppercase tracking-wider">
                {sessionData.therapyType} &bull; {sessionData.sessionTime}
              </span>
            </div>

            <div className="p-3 text-xs bg-gray-50 rounded-xl text-gray-600 text-left space-y-1 border border-gray-100">
              <p className="flex justify-between">
                <span className="text-gray-400 font-medium">Terapis:</span>
                <span className="font-bold text-[#1E5C58]">
                  {sessionData.therapistName}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-400 font-medium">Tanggal:</span>
                <span className="font-bold text-gray-700">
                  {sessionData.sessionDate}
                </span>
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 px-6 py-4 bg-gray-50/80 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCopyToken}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-[#1E5C58] bg-white border border-teal-100 rounded-xl hover:bg-teal-50 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Tercopy" : "Salin Token"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-[#2B7A75] rounded-xl hover:bg-[#1E5C58] shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak QR
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
