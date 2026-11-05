import React, { useState, useRef } from 'react';
import {
  ShieldCheck, Download, Upload, Trash2, Tag, BookOpen,
  Info, ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function SettingsView({
  categories,
  merchantRules,
  onExportCSV,
  onExportBackup,
  onImportBackup,
  onClearAllData,
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
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Privacy First (No-Track) Showcase Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight">
              No-Track Tracker Guarantee
            </h3>
            <span className="text-[11px] text-emerald-100 font-medium">
              ความเป็นส่วนตัว 100% บนเครื่อง Android
            </span>
          </div>
        </div>

        <p className="text-xs text-emerald-50 leading-relaxed mb-3">
          ตามแนวคิดของ Pygmy ดั้งเดิม ข้อมูลสลิป ตัวเลขการเงิน และการประมวลผลทั้งหมดทำงานภายในเครื่องของคุณเท่านั้น (On-Device 100%) ไม่มีการส่งรูปหรือตัวเลขไปยังเซิร์ฟเวอร์ภายนอก ไม่มีโฆษณา และไม่มีระบบติดตามการใช้งานใดๆ ทั้งสิ้น
        </p>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-center text-[10px]">
          <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
            <span className="font-bold block text-white">🔒 Offline 100%</span>
            <span className="text-emerald-200">ไม่พึ่งพาเน็ต</span>
          </div>
          <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
            <span className="font-bold block text-white">🚫 No Server</span>
            <span className="text-emerald-200">ไม่มีเซิร์ฟเวอร์กลาง</span>
          </div>
          <div className="bg-white/10 rounded-xl p-1.5 backdrop-blur-xs">
            <span className="font-bold block text-white">✨ Zero Ads</span>
            <span className="text-emerald-200">ไม่มีโฆษณากวนใจ</span>
          </div>
        </div>
      </div>

      {/* Data Export & Backup Section */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
        <h4 className="font-extrabold text-xs text-neutral-900 uppercase tracking-wide">
          การจัดการข้อมูล & สำรองไฟล์
        </h4>

        {/* Export CSV */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200/70">
          <div>
            <h5 className="font-bold text-xs text-neutral-900">
              ส่งออกไฟล์ CSV (สำหรับ Excel / AI)
            </h5>
            <p className="text-[11px] text-neutral-500">
              รองรับภาษาไทย UTF-8 BOM เปิดใน Excel ได้ทันทีไม่เป็นภาษาต่างดาว
            </p>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onExportCSV();
            }}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 active:scale-95 shadow-xs transition-all flex items-center gap-1.5"
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
            className="p-3 rounded-2xl border border-neutral-200 hover:bg-neutral-50 active:scale-98 transition-all flex flex-col items-center justify-center text-center text-neutral-800"
          >
            <Download className="w-5 h-5 text-amber-500 mb-1" />
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
            className="p-3 rounded-2xl border border-neutral-200 hover:bg-neutral-50 active:scale-98 transition-all flex flex-col items-center justify-center text-center text-neutral-800"
          >
            <Upload className="w-5 h-5 text-blue-500 mb-1" />
            <span className="font-bold text-xs">กู้คืนข้อมูล (Restore)</span>
            <span className="text-[10px] text-neutral-400">เลือกไฟล์ JSON</span>
          </button>
        </div>

        {importStatus && (
          <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            importStatus.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Learned Merchant Rules Section */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-xs text-neutral-900 uppercase tracking-wide">
              กฎจดจำร้านค้าอัตโนมัติ ({merchantRulesList.length})
            </h4>
            <p className="text-[10px] text-neutral-400">
              เมื่อเปลี่ยนหมวดหมู่ร้านค้า ระบบจะจดจำไว้ใช้ในครั้งต่อไป
            </p>
          </div>
          {merchantRulesList.length > 0 && (
            <button
              onClick={() => {
                sound.playPop();
                onClearMerchantRules();
              }}
              className="text-[11px] font-medium text-rose-500 hover:text-rose-700"
            >
              ล้างกฎ
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
          {merchantRulesList.length === 0 ? (
            <span className="text-xs text-neutral-400 py-2">
              ยังไม่มีการบันทึกกฎร้านค้า (จะสร้างให้อัตโนมัติเมื่อเลือกหมวดหมู่)
            </span>
          ) : (
            merchantRulesList.map(([merchant, catId]) => (
              <span
                key={merchant}
                className="px-2 py-1 bg-neutral-100 rounded-lg text-[11px] font-medium text-neutral-700 border border-neutral-200"
              >
                {merchant} → <b className="text-amber-600">{catId}</b>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs">
        <h4 className="font-extrabold text-xs text-rose-600 uppercase tracking-wide mb-2">
          ล้างข้อมูลทั้งหมด
        </h4>

        {showConfirmClear ? (
          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 flex flex-col gap-2">
            <span className="text-xs font-bold text-rose-800">
              ⚠️ แน่ใจหรือไม่? ข้อมูลรายจ่ายทั้งหมดจะถูกลบและกู้คืนไม่ได้
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-1.5 text-xs text-neutral-600 bg-white border border-neutral-200 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  sound.playPop();
                  onClearAllData();
                  setShowConfirmClear(false);
                }}
                className="flex-1 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-xl"
              >
                ยืนยันลบทั้งหมด
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            ล้างข้อมูลทั้งหมดในเครื่อง
          </button>
        )}
      </div>

      {/* About Pygmy & Credits */}
      <div className="text-center py-4 text-xs text-neutral-400 space-y-1">
        <p className="font-semibold text-neutral-600">
          Pygmy: No-Track Tracker (Android Edition)
        </p>
        <p className="text-[11px]">
          แนวคิดจากแอป iOS <b>"Pygmy: จดรายจ่ายแบบไม่จด"</b> โดย Peerasak Unsakon
        </p>
        <p className="text-[10px] text-neutral-400">
          ทำงานออฟไลน์ 100% • รองรับธนาคารไทยทุกแห่ง
        </p>
      </div>
    </div>
  );
}
