import { FileText, Trash2, CheckCircle2, AlertCircle, RefreshCw, Download, Layers } from 'lucide-react';
import { PDFFile, ConversionConfig } from '../types';

interface FileQueueProps {
  files: PDFFile[];
  onRemove: (id: string) => void;
  onDownloadZip: (file: PDFFile, format: 'png' | 'jpeg') => void;
  isProcessing: boolean;
}

export default function FileQueue({ files, onRemove, onDownloadZip, isProcessing }: FileQueueProps) {
  // Format bytes to human readable sizes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (files.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-rose-500" />
          <h2 className="font-sans font-bold text-base text-gray-900">
            รายการไฟล์ที่เลือก ({files.length} ไฟล์)
          </h2>
        </div>
      </div>

      <div className="space-y-3.5">
        {files.map((item) => {
          const isIdle = item.status === 'idle';
          const isLoading = item.status === 'loading';
          const isProcessingItem = item.status === 'processing';
          const isCompleted = item.status === 'completed';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isProcessingItem
                  ? 'border-amber-300 bg-amber-50/10 shadow-sm shadow-amber-100/50'
                  : isCompleted
                  ? 'border-emerald-100 bg-emerald-50/5'
                  : isError
                  ? 'border-rose-100 bg-rose-50/5'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                    isProcessingItem
                      ? 'bg-amber-100 text-amber-600'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-600'
                      : isError
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <FileText size={20} className="stroke-[2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans font-bold text-sm text-gray-900 truncate" title={`${item.name}.pdf`}>
                      {item.name}.pdf
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 font-normal">
                      <span>{formatBytes(item.size)}</span>
                      {item.pageCount > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>{item.pageCount} หน้า</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Indicator & Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {isIdle && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                      รอเริ่มงาน
                    </span>
                  )}
                  {isLoading && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin" />
                      อ่านไฟล์...
                    </span>
                  )}
                  {isProcessingItem && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin" />
                      กำลังแปลงหน้า {item.currentPage}/{item.pageCount}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} className="stroke-[2.5]" />
                      สำเร็จ ({item.pageCount} หน้า)
                    </span>
                  )}
                  {isError && (
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full flex items-center gap-1" title={item.errorMsg}>
                      <AlertCircle size={12} />
                      ล้มเหลว
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    {isCompleted && (
                      <button
                        onClick={() => onDownloadZip(item, 'png')} // default downloads zip format
                        className="p-1.5 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-gray-200 hover:border-rose-100 transition-colors cursor-pointer"
                        title="ดาวน์โหลดไฟล์รูปทั้งหมดเป็น ZIP"
                      >
                        <Download size={15} />
                      </button>
                    )}
                    {!isProcessingItem && !isProcessing && (
                      <button
                        onClick={() => onRemove(item.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบออกจากรายการ"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {(isProcessingItem || isCompleted) && (
                <div className="mt-3.5">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1.5 text-[10px] text-gray-400 font-normal">
                    <span>ความสำเร็จ {Math.round(item.progress)}%</span>
                    <span>
                      {isCompleted ? 'แปลงไฟล์เรียบร้อย' : `กำลังประมวลผลไฟล์อย่างปลอดภัย`}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {isError && item.errorMsg && (
                <p className="mt-2 text-xs text-rose-600 bg-rose-50/50 px-3 py-1.5 rounded-lg border border-rose-100/30">
                  {item.errorMsg}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
