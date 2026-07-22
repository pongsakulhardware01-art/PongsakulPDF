import { useState } from 'react';
import { Download, Copy, Eye, X, ChevronLeft, ChevronRight, Check, Image as ImageIcon } from 'lucide-react';
import { PDFFile, PDFPageImage } from '../types';

interface PreviewGridProps {
  files: PDFFile[];
  onDownloadPage: (fileName: string, page: PDFPageImage, format: 'png' | 'jpeg') => void;
  format: 'png' | 'jpeg';
}

export default function PreviewGrid({ files, onDownloadPage, format }: PreviewGridProps) {
  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    file: PDFFile;
    pageIndex: number;
  } | null>(null);

  // Copy status per page
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopyImage = async (pageId: string, dataUrl: string) => {
    try {
      // Convert dataUrl (whether PNG or JPEG) to a pure PNG Blob because ClipboardItem strictly requires 'image/png'
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('ไม่สามารถสร้าง Canvas Context ได้'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('ไม่สามารถแปลงเป็นรูปภาพ PNG Blob ได้'));
            }
          }, 'image/png');
        };
        img.onerror = () => reject(new Error('ไม่สามารถโหลดภาพสำหรับคัดลอกได้'));
        img.src = dataUrl;
      });

      // Write PNG blob to system clipboard
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': pngBlob,
          }),
        ]);
        setCopiedStates((prev) => ({ ...prev, [pageId]: true }));
        setTimeout(() => {
          setCopiedStates((prev) => ({ ...prev, [pageId]: false }));
        }, 2500);
      } else {
        throw new Error('Clipboard API ไม่รองรับในเบราว์เซอร์นี้');
      }
    } catch (err: any) {
      console.error('Failed to copy image to clipboard:', err);
      alert('คัดลอกรูปภาพไม่สำเร็จ: เบราว์เซอร์อาจบล็อกการเข้าถึงคลิปบอร์ดใน iframe คุณสามารถเปิดรูปภาพในโหมดเต็มจอ หรือคลิกขวาที่รูปแล้วเลือก "คัดลอกรูปภาพ" (Copy image) ได้ครับ');
    }
  };

  const handleNextPage = () => {
    if (!lightbox) return;
    const { file, pageIndex } = lightbox;
    if (pageIndex < file.pages.length - 1) {
      setLightbox({ file, pageIndex: pageIndex + 1 });
    }
  };

  const handlePrevPage = () => {
    if (!lightbox) return;
    const { file, pageIndex } = lightbox;
    if (pageIndex > 0) {
      setLightbox({ file, pageIndex: pageIndex - 1 });
    }
  };

  // Check if there are any converted pages
  const hasConvertedPages = files.some(f => f.pages.length > 0);

  if (!hasConvertedPages) return null;

  return (
    <div className="space-y-8 mt-4 animate-fadeIn">
      {files.map((file) => {
        if (file.pages.length === 0) return null;

        return (
          <div key={file.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-gray-900">
                    รูปภาพจากไฟล์: {file.name}.pdf
                  </h3>
                  <p className="text-xs text-gray-500 font-normal">
                    แปลงเสร็จสมบูรณ์ {file.pages.length} หน้า
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {file.pages.length === 1 && (
                  <button
                    type="button"
                    onClick={() => handleCopyImage(`${file.id}_1`, file.pages[0].dataUrl)}
                    className={`px-3 py-1.5 text-xs font-sans font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                      copiedStates[`${file.id}_1`]
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
                    }`}
                  >
                    {copiedStates[`${file.id}_1`] ? (
                      <>
                        <Check size={14} className="stroke-[2.5]" />
                        <span>คัดลอกเรียบร้อย!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>คัดลอกรูปภาพ</span>
                      </>
                    )}
                  </button>
                )}
                <span className="text-xs text-gray-400 font-normal hidden sm:inline">
                  คลิกที่รูปภาพเพื่อเปิดดูคุณภาพสูง
                </span>
              </div>
            </div>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {file.pages.map((page, index) => {
                const pageId = `${file.id}_${page.pageNumber}`;
                const isCopied = copiedStates[pageId];
                const imageFileName = `${file.name}_page_${page.pageNumber}.${format === 'png' ? 'png' : 'jpg'}`;

                return (
                  <div
                    key={page.pageNumber}
                    className="group relative bg-gray-50 rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-rose-200 flex flex-col justify-between"
                  >
                    {/* Image Aspect ratio wrapper */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyImage(pageId, page.dataUrl)}
                            className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm hover:text-rose-600 transition-colors cursor-pointer"
                            title={isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกรูปภาพ'}
                          >
                            {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                          <button
                            onClick={() => onDownloadPage(file.name, page, format)}
                            className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm hover:text-rose-600 transition-colors cursor-pointer"
                            title="ดาวน์โหลดรูปนี้"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => setLightbox({ file, pageIndex: index })}
                          className="w-full py-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm font-sans font-semibold text-[11px] flex items-center justify-center gap-1 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>ดูภาพเต็ม</span>
                        </button>
                      </div>
                    </div>

                    {/* Footer labels and visible persistent buttons */}
                    <div className="p-2.5 border-t border-gray-100 bg-white space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800">หน้า {page.pageNumber}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {page.width}x{page.height}px
                        </span>
                      </div>
                      
                      {/* Persistent Quick Action Buttons: Download on Left, Copy on RIGHT */}
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => onDownloadPage(file.name, page, format)}
                          className="py-1.5 px-2 text-xs font-sans font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
                          title="ดาวน์โหลดรูปหน้านี้"
                        >
                          <Download size={13} />
                          <span className="text-[11px] font-semibold">โหลด</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyImage(pageId, page.dataUrl)}
                          className={`flex-1 py-1.5 px-2.5 text-xs font-sans font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm min-w-0 ${
                            isCopied
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check size={13} className="stroke-[2.5] shrink-0" />
                              <span className="truncate">คัดลอกแล้ว!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} className="shrink-0" />
                              <span className="truncate">คัดลอกรูปภาพ</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Lightbox / Modal Modal */}
      {lightbox && (
        <div className="fixed inset-0 z-100 bg-black/95 flex flex-col items-center justify-between p-4 animate-fadeIn">
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white border-b border-white/10 pb-3">
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-xs sm:max-w-md">
                {lightbox.file.name}.pdf
              </span>
              <span className="text-xs text-gray-400 font-normal">
                หน้า {lightbox.file.pages[lightbox.pageIndex].pageNumber} จาก {lightbox.file.pages.length}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Copy Button in Lightbox */}
              <button
                onClick={() => {
                  const currentPage = lightbox.file.pages[lightbox.pageIndex];
                  const pageId = `${lightbox.file.id}_${currentPage.pageNumber}`;
                  handleCopyImage(pageId, currentPage.dataUrl);
                }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-sans font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  copiedStates[`${lightbox.file.id}_${lightbox.file.pages[lightbox.pageIndex].pageNumber}`]
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                {copiedStates[`${lightbox.file.id}_${lightbox.file.pages[lightbox.pageIndex].pageNumber}`] ? (
                  <>
                    <Check size={14} className="stroke-[2.5]" />
                    <span>คัดลอกเรียบร้อย!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>คัดลอกรูปภาพ</span>
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  onDownloadPage(
                    lightbox.file.name,
                    lightbox.file.pages[lightbox.pageIndex],
                    format
                  )
                }
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-sans font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span className="hidden sm:inline">ดาวน์โหลดหน้านี้</span>
              </button>
              <button
                onClick={() => setLightbox(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Centered Image with side arrows */}
          <div className="flex-1 w-full flex items-center justify-between relative my-4">
            {/* Prev Arrow */}
            <button
              onClick={handlePrevPage}
              disabled={lightbox.pageIndex === 0}
              className={`absolute left-2 z-10 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ${
                lightbox.pageIndex === 0 ? 'opacity-20 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeft size={24} />
            </button>

            {/* High-res Image Wrapper */}
            <div className="w-full h-full flex items-center justify-center p-2">
              <img
                src={lightbox.file.pages[lightbox.pageIndex].dataUrl}
                alt={`Lightbox Page ${lightbox.file.pages[lightbox.pageIndex].pageNumber}`}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/5 bg-white p-1"
              />
            </div>

            {/* Next Arrow */}
            <button
              onClick={handleNextPage}
              disabled={lightbox.pageIndex === lightbox.file.pages.length - 1}
              className={`absolute right-2 z-10 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ${
                lightbox.pageIndex === lightbox.file.pages.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
              }`}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Bottom Bar Thumbnail Strip */}
          <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-center gap-2 overflow-x-auto">
            {lightbox.file.pages.map((p, idx) => (
              <button
                key={p.pageNumber}
                onClick={() => setLightbox({ file: lightbox.file, pageIndex: idx })}
                className={`relative w-12 h-16 rounded border overflow-hidden shrink-0 transition-all cursor-pointer ${
                  idx === lightbox.pageIndex
                    ? 'border-rose-500 ring-2 ring-rose-500/50 scale-105'
                    : 'border-white/10 hover:border-white/40'
                }`}
              >
                <img src={p.dataUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover bg-white" />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 font-bold">
                  {p.pageNumber}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
