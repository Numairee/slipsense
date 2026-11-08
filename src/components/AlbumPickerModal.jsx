import React, { useState, useEffect } from 'react';
import { X, Folder, FolderCheck, Zap, Sparkles, Loader2, Image, ChevronRight, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { AutoScanner } from '../utils/galleryAutoScanner';
import { sound } from '../utils/sound';

export default function AlbumPickerModal({
  isOpen,
  onClose,
  onSelectAlbum,
  onScanAllBanks,
  isScanning = false
}) {
  if (!isOpen) return null;

  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlbums = async () => {
    setIsLoading(true);
    try {
      const list = await AutoScanner.getPhotoAlbums();
      setAlbums(list || []);
    } catch (e) {
      console.warn('loadAlbums error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const bankAlbums = albums.filter(a => a.isBank);
  const screenshotAlbums = albums.filter(a => a.isScreenshot && !a.isBank);
  const otherAlbums = albums.filter(a => !a.isBank && !a.isScreenshot);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0D121F] border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                เลือกโฟลเดอร์ / อัลบั้มที่ต้องการสแกน
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">
                สแกนรูปภาพทั้งหมดในโฟลเดอร์ที่เลือกแบบ 100% ครบถ้วน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Auto-Scan All Bank Folders Option */}
          <button
            onClick={() => {
              sound.playPop();
              onScanAllBanks();
              onClose();
            }}
            disabled={isScanning}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="text-left">
                <div className="leading-tight font-black">
                  ค้นหาสลิปจากรูปทั้งหมดในเครื่อง ⚡
                </div>
                <div className="text-[10px] text-emerald-100 font-medium mt-0.5">
                  ตรวจทุกโฟลเดอร์ที่อนุญาต ไม่มีจำกัดจำนวนรูป อาจใช้เวลาหลายนาที
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-white/80" />
          </button>

          <p className="text-xs text-neutral-400">หากต้องการตรวจครบ ให้ตั้งสิทธิ์รูปภาพเป็น “อนุญาตทั้งหมด” รูปที่อยู่เฉพาะบนคลาวด์หรือในพื้นที่ส่วนตัวของแอปอื่นจะไม่ปรากฏในการสแกน</p>
          {/* Album List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                โฟลเดอร์ที่ตรวจพบบนเครื่อง
              </span>
              <button
                onClick={loadAlbums}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
                <span className="text-xs font-bold text-neutral-300">
                  กำลังค้นหาโฟลเดอร์ในเครื่อง...
                </span>
              </div>
            ) : albums.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <p className="text-xs text-neutral-400">ไม่พบอัลบั้มรูปภาพในเครื่อง</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Bank Folders (Highest Priority) */}
                {bankAlbums.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-400 px-1">
                      โฟลเดอร์แอปธนาคาร (แนะนำ)
                    </div>
                    {bankAlbums.map((album) => (
                      <div
                        key={album.bucketName}
                        onClick={() => {
                          sound.playPop();
                          onSelectAlbum(album.bucketName);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-emerald-500/30 hover:border-emerald-500/60 active:scale-98 cursor-pointer flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                            🏦
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <span>{album.bankLabel || album.bucketName}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                ธนาคาร
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              โฟลเดอร์: {album.bucketName} • {album.count} รูป
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            สแกนทั้งโฟลเดอร์
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Screenshot Folders */}
                {screenshotAlbums.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-cyan-400 px-1">
                      โฟลเดอร์ภาพหน้าจอ (Screenshots)
                    </div>
                    {screenshotAlbums.map((album) => (
                      <div
                        key={album.bucketName}
                        onClick={() => {
                          sound.playPop();
                          onSelectAlbum(album.bucketName);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-cyan-500/30 hover:border-cyan-500/60 active:scale-98 cursor-pointer flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                            📸
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <span>{album.bankLabel || album.bucketName}</span>
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              {album.count} รูป
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                            สแกนทั้งหมด
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Other Folders */}
                {otherAlbums.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-neutral-400 px-1">
                      โฟลเดอร์อื่นๆ บนเครื่อง
                    </div>
                    {otherAlbums.slice(0, 10).map((album) => (
                      <div
                        key={album.bucketName}
                        onClick={() => {
                          sound.playPop();
                          onSelectAlbum(album.bucketName);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 active:scale-98 cursor-pointer flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-neutral-800 text-neutral-400 flex items-center justify-center font-bold text-sm shrink-0">
                            📁
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {album.bucketName}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              {album.count} รูป
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-lg group-hover:bg-neutral-700 group-hover:text-white transition-all">
                            สแกน
                          </span>
                          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 border-t border-neutral-800 bg-[#080C14] text-center text-[10px] text-neutral-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>อ่านไฟล์ในเครื่อง 100% ไม่ส่งข้อมูลออกนอกเครื่อง และไม่ลบรูปใดๆ ในอัลบั้ม</span>
        </div>
      </div>
    </div>
  );
}

