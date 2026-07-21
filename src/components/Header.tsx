import { FileImage, Settings, HelpCircle, FileText } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500 text-white p-2.5 rounded-xl shadow-md shadow-rose-500/20 flex items-center justify-center animate-pulse">
            <FileImage size={22} className="stroke-[2]" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-gray-900 tracking-tight flex items-center gap-1.5">
              <span>PDF to Image Converter</span>
              <span className="text-[10px] font-mono bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-100 uppercase tracking-wider">PRO</span>
            </h1>
            <p className="text-xs text-gray-500 font-sans font-normal">แปลงไฟล์ PDF เป็นรูปภาพคุณภาพสูง รวดเร็ว และเป็นส่วนตัว 100%</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 font-sans">
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>ทำงานแบบ Client-Side (ข้อมูลปลอดภัย 100%)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
