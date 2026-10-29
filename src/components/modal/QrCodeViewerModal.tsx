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
    childId?: string;
    childName: string;
    medicalRecordNumber: string;
    guardianName?: string;
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

  const isPermanentRM =
    Boolean(sessionData.medicalRecordNumber) &&
    sessionData.medicalRecordNumber !== "-" &&
    sessionData.medicalRecordNumber !== "RM-N/A";

  const permanentToken = isPermanentRM
    ? sessionData.medicalRecordNumber
    : sessionData.childId || sessionData.attendanceToken;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    permanentToken
  )}`;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(permanentToken);
    setCopied(true);
    showSuccessToast(`Kode presensi (${permanentToken}) berhasil disalin!`, "Disalin");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kartu QR Pasien - ${sessionData.childName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 30px; background: #fafafa; }
            .card {
              border: 2px solid #1E5C58;
              border-radius: 18px;
              padding: 24px;
              max-width: 320px;
              margin: 0 auto;
              background: #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            }
            .header { border-bottom: 2px solid #EAF6F4; padding-bottom: 12px; margin-bottom: 14px; }
            h2 { color: #1E5C58; margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
            .subtitle { color: #2B7A75; font-size: 11px; font-weight: bold; margin-top: 4px; text-transform: uppercase; }
            img { margin: 12px 0; width: 190px; height: 190px; }
            h3 { margin: 8px 0 4px; color: #1f2937; font-size: 16px; font-weight: 800; }
            .rm-badge {
              display: inline-block;
              background: #EAF6F4;
              color: #1E5C58;
              padding: 4px 10px;
              border-radius: 8px;
              font-weight: 800;
              font-size: 12px;
              letter-spacing: 0.5px;
            }
            .footer-note {
              margin-top: 14px;
              font-size: 10px;
              color: #6b7280;
              line-height: 1.4;
              border-top: 1px dashed #e5e7eb;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2>PUSPA HOLISTIC</h2>
              <div class="subtitle">Kartu QR Presensi Pasien</div>
            </div>
            <img src="${qrUrl}" alt="QR Code Pasien" />
            <h3>${sessionData.childName}</h3>
            <div class="rm-badge">No. RM: ${sessionData.medicalRecordNumber}</div>
            ${sessionData.guardianName ? `<p style="margin: 6px 0 0; font-size: 11px; color: #4b5563;">Wali: <b>${sessionData.guardianName}</b></p>` : ""}
            <div class="footer-note">
              Tunjukkan kartu ini ke petugas atau kamera scan saat tiba di klinik untuk presensi otomatis setiap sesi terapi.
            </div>
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
              <div>
                <h3 className="text-base font-extrabold tracking-tight leading-tight">
                  Kartu QR Presensi Pasien
                </h3>
              </div>
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 text-[10px] font-extrabold text-[#1E5C58] bg-teal-50 border border-teal-100 rounded-full">
                <span>1 QR Tetap untuk Seluruh Sesi</span>
              </div>
              <h4 className="text-base font-extrabold text-gray-800">
                {sessionData.childName}
              </h4>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">
                No. RM:{" "}
                <span className="text-[#1E5C58] font-bold">
                  {sessionData.medicalRecordNumber}
                </span>
                {sessionData.guardianName && (
                  <span className="text-gray-400 ml-1.5 font-normal">
                    &bull; Wali: <b className="text-gray-600">{sessionData.guardianName}</b>
                  </span>
                )}
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

            <div className="p-3 text-[11px] bg-[#F4F9F8] rounded-xl text-teal-900 text-left border border-teal-100/70 space-y-1">
              <p className="font-bold text-[#1E5C58] flex items-center gap-1">
                <span>💡</span> QR Code Berlaku Permanen
              </p>
              <p className="text-gray-600 leading-relaxed text-[10.5px]">
                Pasien cukup mencetak atau menyimpan QR ini satu kali. Sistem otomatis mengenali jadwal sesi terapi hari ini saat kartu di-scan.
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
              {copied ? "Tercopy" : "Salin Kode"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-[#2B7A75] rounded-xl hover:bg-[#1E5C58] shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Kartu
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
