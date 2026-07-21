import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Download, 
  Trash2, 
  Layers, 
  CheckCircle, 
  Info,
  ShieldCheck,
  Zap
} from 'lucide-react';
import JSZip from 'jszip';

import Header from './components/Header';
import ConversionSettings from './components/ConversionSettings';
import FileQueue from './components/FileQueue';
import PreviewGrid from './components/PreviewGrid';

import { PDFFile, ConversionConfig, PDFPageImage } from './types';
import { getPdfPageCount, convertPdf } from './utils/pdfProcessor';

export default function App() {
  // Config state
  const [config, setConfig] = useState<ConversionConfig>({
    scale: 3, // 3x scale (~300 DPI) default for excellent quality
    format: 'png',
    quality: 0.85
  });

  // Files state
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Events
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFileSelection(e.target.files);
    }
  };

  // Process selected files
  const handleFileSelection = async (fileList: FileList) => {
    const newFilesList: PDFFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Validate PDF format
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert(`ไฟล์ "${file.name}" ไม่ใช่ไฟล์ PDF โปรดเลือกเฉพาะไฟล์ PDF เท่านั้น`);
        continue;
      }

      // Check if file already added to queue
      if (files.some(f => f.name === file.name.substring(0, file.name.lastIndexOf('.')) && f.size === file.size)) {
        continue;
      }

      const fileId = Math.random().toString(36).substring(2, 9);
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

      const newFile: PDFFile = {
        id: fileId,
        file: file,
        name: cleanName,
        size: file.size,
        pageCount: 0,
        status: 'loading',
        progress: 0,
        currentPage: 0,
        pages: []
      };

      newFilesList.push(newFile);
    }

    if (newFilesList.length === 0) return;

    // Add files to state with loading status
    setFiles(prev => [...prev, ...newFilesList]);

    // Fetch page counts in the background
    for (const newFile of newFilesList) {
      try {
        const pageCount = await getPdfPageCount(newFile.file);
        setFiles(prev => prev.map(f => f.id === newFile.id ? { 
          ...f, 
          status: 'idle', 
          pageCount 
        } : f));
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.id === newFile.id ? { 
          ...f, 
          status: 'error', 
          errorMsg: err.message || 'ไม่สามารถอ่านจำนวนหน้าของเอกสารนี้ได้' 
        } : f));
      }
    }
  };

  // Start converting all files in the queue
  const startBatchConversion = async () => {
    if (files.length === 0 || isProcessing) return;

    // Reset files that were already converted or had errors
    setFiles(prev => prev.map(f => ({
      ...f,
      status: f.status === 'completed' || f.status === 'error' ? 'idle' : f.status,
      progress: 0,
      currentPage: 0,
      pages: []
    })));

    setIsProcessing(true);

    // Get all files that need processing
    const pendingFiles = files.filter(f => f.status === 'idle' || f.status === 'completed' || f.status === 'error');

    for (const item of pendingFiles) {
      // Mark file as processing
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 0 } : f));

      const accumulatedPages: PDFPageImage[] = [];

      await convertPdf(
        item.file,
        config.scale,
        config.format,
        config.quality,
        // Page converted callback
        (pageNum, totalPages, dataUrl, width, height) => {
          accumulatedPages.push({
            pageNumber: pageNum,
            dataUrl,
            width,
            height
          });

          // Sort pages just to be absolutely sure they maintain correct order
          accumulatedPages.sort((a, b) => a.pageNumber - b.pageNumber);

          setFiles(prev => prev.map(f => f.id === item.id ? {
            ...f,
            currentPage: pageNum,
            progress: (pageNum / totalPages) * 100,
            pages: [...accumulatedPages]
          } : f));
        },
        // Failure callback
        (errorMsg) => {
          setFiles(prev => prev.map(f => f.id === item.id ? {
            ...f,
            status: 'error',
            errorMsg
          } : f));
        }
      );

      // Check if finished with success
      setFiles(prev => prev.map(f => {
        if (f.id === item.id) {
          return f.status === 'error' ? f : { ...f, status: 'completed', progress: 100 };
        }
        return f;
      }));
    }

    setIsProcessing(false);
  };

  // Remove single file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Clear all queue
  const clearAll = () => {
    if (isProcessing) return;
    setFiles([]);
  };

  // Download single image page directly
  const handleDownloadPage = (fileName: string, page: PDFPageImage, format: 'png' | 'jpeg') => {
    const ext = format === 'png' ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = page.dataUrl;
    a.download = `${fileName}_page_${page.pageNumber}.${ext}`;
    a.click();
  };

  // Generate ZIP for a single converted PDF document
  const downloadSingleFileZip = async (file: PDFFile, format: 'png' | 'jpeg') => {
    if (file.pages.length === 0) return;

    try {
      const zip = new JSZip();
      const ext = format === 'png' ? 'png' : 'jpg';

      file.pages.forEach((page) => {
        const base64Data = page.dataUrl.split(',')[1];
        zip.file(`${file.name}_page_${page.pageNumber}.${ext}`, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}_images.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating ZIP:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์บีบอัด ZIP');
    }
  };

  // Generate Master ZIP containing folders for each PDF containing its pages
  const downloadMasterZip = async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.pages.length > 0);
    if (completedFiles.length === 0) return;

    try {
      const zip = new JSZip();
      const ext = config.format === 'png' ? 'png' : 'jpg';

      completedFiles.forEach((file) => {
        const folder = zip.folder(`${file.name}_images`);
        if (folder) {
          file.pages.forEach((page) => {
            const base64Data = page.dataUrl.split(',')[1];
            folder.file(`${file.name}_page_${page.pageNumber}.${ext}`, base64Data, { base64: true });
          });
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_all_images_organized.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating master ZIP:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์บีบอัด ZIP ทั้งหมด');
    }
  };

  // Check stats for buttons
  const readyToConvert = files.some(f => f.status === 'idle');
  const hasCompletedFiles = files.some(f => f.status === 'completed' && f.pages.length > 0);

  return (
    <div id="app" className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-rose-500/15 selection:text-rose-700 text-gray-800">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Actions & Configuration (4 cols on large screens) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Conversion Config */}
            <ConversionSettings 
              config={config} 
              onChange={setConfig} 
              disabled={isProcessing} 
            />

            {/* Privacy & Security banner */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex gap-3 text-xs text-gray-500 leading-relaxed font-normal">
              <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-gray-700">ความเป็นส่วนตัว 100% (Local processing)</p>
                <p>ไฟล์ PDF และรูปภาพที่แปลงเสร็จ จะถูกประมวลผลบนเบราว์เซอร์ในเครื่องคอมพิวเตอร์ของคุณเท่านั้น ไม่มีการอัปโหลดส่งไปยังเซิร์ฟเวอร์ใดๆ มั่นใจได้ว่าข้อมูลของคุณปลอดภัยและเป็นส่วนตัวอย่างแน่นอน</p>
              </div>
            </div>

          </div>

          {/* Right Column: Upload zone & Queue (7 cols on large screens) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                isDragging
                  ? 'border-rose-500 bg-rose-50/20 scale-[0.99] ring-4 ring-rose-500/5'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-4">
                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isDragging ? 'bg-rose-500 text-white scale-110' : 'bg-gray-50 text-gray-400 group-hover:bg-rose-50 group-hover:text-rose-500'
                }`}>
                  <Upload size={28} className="stroke-[1.75]" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-sans font-bold text-base text-gray-900">
                    ลากไฟล์ PDF ของคุณมาวางที่นี่
                  </h3>
                  <p className="text-sm text-gray-500 font-normal">
                    หรือ <span className="text-rose-500 font-semibold hover:underline">คลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์</span>
                  </p>
                </div>

                <div className="flex justify-center gap-4 text-xs text-gray-400 font-normal pt-2 border-t border-gray-50">
                  <span className="flex items-center gap-1">
                    <Zap size={13} className="text-amber-500" />
                    รองรับหลายไฟล์พร้อมกัน
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-200 self-center"></span>
                  <span>เรียงลำดับหน้าให้อัตโนมัติ</span>
                </div>
              </div>
            </div>

            {/* Queue Component */}
            <FileQueue 
              files={files} 
              onRemove={removeFile} 
              onDownloadZip={downloadSingleFileZip}
              isProcessing={isProcessing}
            />

            {/* Main Action Bar */}
            {files.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 hover:border-rose-200 text-gray-500 hover:text-rose-600 hover:bg-rose-50 font-sans font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>ล้างรายการทั้งหมด</span>
                </button>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                  {hasCompletedFiles && (
                    <button
                      type="button"
                      onClick={downloadMasterZip}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-sans font-semibold text-sm shadow-md shadow-emerald-600/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Download size={16} />
                      <span>ดาวน์โหลดไฟล์ทั้งหมด (ZIP)</span>
                    </button>
                  )}

                  {readyToConvert && (
                    <button
                      type="button"
                      onClick={startBatchConversion}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-sans font-semibold text-sm shadow-md shadow-rose-500/15 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>กำลังแปลงไฟล์...</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} className="fill-current" />
                          <span>เริ่มแปลงเป็นรูปภาพ</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Conversion Previews Component */}
            <PreviewGrid 
              files={files} 
              onDownloadPage={handleDownloadPage} 
              format={config.format} 
            />

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-sans font-normal">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; 2026 PDF to Image Converter - เน้นคุณภาพสูงสุด รวดเร็ว และเป็นส่วนตัว
          </div>
          <div className="flex gap-4">
            <span>ไม่ต้องติดตั้งโปรแกรม</span>
            <span>ทำงานแบบออฟไลน์ได้</span>
            <span>ปลอดภัยด้วย HTML5 APIs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
