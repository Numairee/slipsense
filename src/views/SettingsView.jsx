import React, { useState, useRef } from 'react';
import {
  ShieldCheck, Download, Upload, Trash2, Tag, BookOpen,
  Info, ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Zap
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function SettingsView({
  categories,
  merchantRules,
  autoScanOnStartup,
  onToggleAutoScanOnStartup,
  onExportCSV,
  onExportBackup,
  onImportBackup,
  onOpenResetModal,
  onClearAllData,
  onClearAndRescan,
  onClearMerchantRules,
}) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const success = onImportBackup(text);
        if (success) {
          sound.playSuccess();
          setImportStatus({ success: true, message: 'นำเข้าข้อมูลสำรองเรียบร้อยแล้ว!' });
        } else {
          setImportStatus({ success: false, message: 'ไฟล์ข้อมูลสำรองไม่ถูกต้อง' });
        }
      } catch (err) {
        setImportStatus({ success: false, message: 'เกิดข้อผิดพลาดในการอ่านไฟล์' });
      }
    };
    reader.readAsText(file);
  };

  const merchantRulesList = Object.entries(merchantRules || {});

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Privacy First (No-Track) Showcase Card */}
      <div className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-700/60 text-white p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-white">
              SlipSense 100% On-Device Privacy
            </h3>
            <span className="text-[11px] text-cyan-300 font-medium">
              สแกนและประมวลผลบนเครื่องเท่านั้น ปลอดภัยระดับสูงสุด
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed mb-3">
          ข้อมูลสลิปและรายการธุรกรรมทั้งหมดถูกอ่านและจัดเก็บในหน่วยความจำของเครื่องคุณเท่านั้น ไม่มีการส่งรูปภาพหรือตัวเลขออกภายนอก ไม่มีเซิร์ฟเวอร์ และไม่มีระบบติดตามตัวตน
        </p>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center text-[10px]">
          <div className="bg-white/5 rounded-xl p-2 border border-white/5">
            <span className="font-bold block text-white">🔒 100% Offline</span>
            <span className="text-neutral-400">ทำงานโดยไม่ต้องต่อเน็ต</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 border border-white/5">
            <span className="font-bold block text-white">🚫 No Cloud</span>
            <span className="text-neutral-400">ไม่มีฐานข้อมูลภายนอก</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 border border-white/5">
            <span className="font-bold block text-white">🛡️ Safe Gallery</span>
            <span className="text-neutral-400">ไม่ลบรูปจริงในมือถือ</span>
          </div>
        </div>
      </div>

      {/* Data Export & Backup Section */}
      <div className="bg-neutral-900 rounded-3xl p-4 border border-neutral-800 shadow-md space-y-3">
        <h4 className="font-extrabold text-xs text-neutral-400 uppercase tracking-wide">
          การจัดการข้อมูล & สำรองไฟล์
        </h4>

        {/* Export CSV */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/60">
          <div>
            <h5 className="font-bold text-xs text-white">
              ส่งออกไฟล์ CSV (สำหรับ Excel / AI)
            </h5>
            <p className="text-[11px] text-neutral-400">
              UTF-8 with BOM เปิดใน Excel หรือ Sheets ได้ทันทีโดยสระไม่เพี้ยน
            </p>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onExportCSV();
            }}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV
          </button>
        </div>

        {/* Backup / Restore JSON */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playPop();
              onExportBackup();
            }}
            className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 hover:bg-neutral-800 active:scale-98 transition-all flex flex-col items-center justify-center text-center text-neutral-200"
          >
            <Download className="w-5 h-5 text-amber-400 mb-1" />
            <span className="font-bold text-xs">สำรองข้อมูล (JSON)</span>
            <span className="text-[10px] text-neutral-400">บันทึกทุกรายการ</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => {
              sound.playPop();
              fileInputRef.current?.click();
            }}
            className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 hover:bg-neutral-800 active:scale-98 transition-all flex flex-col items-center justify-center text-center text-neutral-200"
          >
            <Upload className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="font-bold text-xs">กู้คืนข้อมูล (Restore)</span>
            <span className="text-[10px] text-neutral-400">เลือกไฟล์ JSON</span>
          </button>
        </div>

        {importStatus && (
          <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            importStatus.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-neutral-900 rounded-3xl p-4 border border-neutral-800 shadow-md space-y-3">
        <h4 className="font-extrabold text-xs text-neutral-400 uppercase tracking-wide">
          การทำงานของระบบ
        </h4>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/60">
          <div>
            <h5 className="font-bold text-xs text-white">
              สแกนสลิปอัตโนมัติเมื่อเปิดแอป
            </h5>
            <p className="text-[11px] text-neutral-400">
              {autoScanOnStartup
                ? 'เปิดใช้งาน: ค้นหาสลิปใหม่ทันทีที่เข้าแอป'
                : 'ปิดใช้งาน: สแกนเฉพาะเมื่อกดปุ่มบนหน้าแรกเท่านั้น (แนะนำ)'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              if (onToggleAutoScanOnStartup) onToggleAutoScanOnStartup();
            }}
            className={`w-12 h-6.5 rounded-full transition-colors p-1 flex items-center shrink-0 ${
              autoScanOnStartup ? 'bg-cyan-500 justify-end' : 'bg-neutral-700 justify-start'
            }`}
          >
            <div className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
          </button>
        </div>
      </div>

      {/* Danger Zone: Clear App / Reset Data */}
      <div className="bg-rose-950/30 rounded-3xl p-4 border border-rose-800/60 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-xs text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>ล้างข้อมูลแอป (Reset App)</span>
          </h4>
        </div>

        <p className="text-xs text-rose-200/70 leading-relaxed">
          ลบเฉพาะรายการสลิปและข้อมูลที่บันทึกไว้ในตัวแอป (รูปภาพสลิปจริงในแกลเลอรีมือถือของคุณจะไม่ถูกลบหรือแตะต้องอย่างแน่นอน 100%)
        </p>

        <button
          onClick={() => {
            sound.playPop();
            if (onOpenResetModal) {
              onOpenResetModal();
            } else {
              setShowConfirmClear(true);
            }
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          <span>ล้างแอปทั้งหมด (Reset App)</span>
        </button>

        {showConfirmClear && (
          <div className="p-3 bg-neutral-900 rounded-2xl border border-rose-500/50 flex flex-col gap-2 mt-2 animate-fade-in">
            <span className="text-xs font-bold text-rose-300">
              ⚠️ แน่ใจหรือไม่? ข้อมูลรายจ่ายทั้งหมดในแอปจะถูกลบ
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-1.5 text-xs text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  sound.playPop();
                  onClearAllData();
                  setShowConfirmClear(false);
                }}
                className="flex-1 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                ยืนยันล้างทั้งหมด
              </button>
            </div>
          </div>
        )}
      </div>

      {/* About SlipSense */}
      <div className="text-center py-4 text-xs text-neutral-500 space-y-1">
        <p className="font-extrabold text-neutral-300">
          SlipSense v2.0.0 (Smart Slip & Wealth Intelligence)
        </p>
        <p className="text-[11px] text-neutral-400">
          On-Device Machine Learning & Privacy-First Architecture
        </p>
        <p className="text-[10px] text-neutral-500">
          รองรับสลิปธนาคารไทยทุกแห่ง • ปลอดภัย 100% ไม่ส่งข้อมูลออกนอกเครื่อง
        </p>
      </div>
    </div>
  );
}
