import { Settings, Check, HelpCircle } from 'lucide-react';
import { ConversionConfig } from '../types';

interface ConversionSettingsProps {
  config: ConversionConfig;
  onChange: (newConfig: ConversionConfig) => void;
  disabled: boolean;
}

export default function ConversionSettings({ config, onChange, disabled }: ConversionSettingsProps) {
  const qualityPresets = [
    {
      scale: 1,
      label: 'ความละเอียดปกติ (1x)',
      dpi: '~96 DPI',
      desc: 'แปลงรวดเร็วที่สุด ขนาดไฟล์เล็ก เหมาะสำหรับเปิดอ่านเร็วๆ',
      speed: 'เร็วมาก',
      speedColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      scale: 2,
      label: 'คุณภาพปานกลาง (2x)',
      dpi: '~150 DPI',
      desc: 'ตัวอักษรคมชัดปานกลาง เหมาะสำหรับแชร์ทางแชทหรือโซเชียล',
      speed: 'เร็ว',
      speedColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      scale: 3,
      label: 'คุณภาพสูง (3x) - แนะนำ',
      dpi: '~300 DPI',
      desc: 'คมชัดสูงมาก ตัวหนังสือเล็กๆ คมกริบ เหมาะสำหรับพิมพ์หรือทำรายงาน',
      speed: 'ปานกลาง',
      speedColor: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      scale: 4,
      label: 'คุณภาพสูงสุด (4x)',
      dpi: '~400 DPI',
      desc: 'คมชัดระดับสิ่งพิมพ์และภาพเวกเตอร์ เหมาะสำหรับไฟล์แบบแปลนหรือกราฟิก',
      speed: 'ช้า (ใช้แรมเยอะ)',
      speedColor: 'text-rose-600 bg-rose-50 border-rose-100',
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5 border-b border-gray-50 pb-4">
        <Settings size={20} className="text-rose-500" />
        <h2 className="font-sans font-bold text-base text-gray-900">ตั้งค่าการแปลงไฟล์</h2>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-3">นามสกุลไฟล์ภาพปลายทาง</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...config, format: 'png' })}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
              config.format === 'png'
                ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500/10'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-sans font-bold text-sm text-gray-900">PNG (.png)</span>
              {config.format === 'png' && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
            </div>
            <span className="text-xs text-gray-500 font-normal">คุณภาพสูงสุด (Lossless) เหมาะสำหรับเอกสารที่มีตัวอักษรเยอะ</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...config, format: 'jpeg' })}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
              config.format === 'jpeg'
                ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500/10'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-sans font-bold text-sm text-gray-900">JPEG (.jpg)</span>
              {config.format === 'jpeg' && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
            </div>
            <span className="text-xs text-gray-500 font-normal">บีบอัดขนาดไฟล์ได้เล็กกว่า เหมาะสำหรับไฟล์สแกนที่มีรูปภาพเยอะ</span>
          </button>
        </div>
      </div>

      {/* JPEG Quality Slider */}
      {config.format === 'jpeg' && (
        <div className="mb-6 p-4 rounded-xl bg-gray-50/60 border border-gray-100 animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-gray-700">คุณภาพการบีบอัดภาพ (JPEG Quality)</label>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
              {Math.round(config.quality * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.4"
            max="1.0"
            step="0.05"
            disabled={disabled}
            value={config.quality}
            onChange={(e) => onChange({ ...config, quality: parseFloat(e.target.value) })}
            className="w-full accent-rose-500 h-1.5 bg-gray-200 rounded-lg cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-normal">
            <span>ขนาดไฟล์เล็ก (40%)</span>
            <span>ปานกลาง (75%)</span>
            <span>ชัดสุด (100%)</span>
          </div>
        </div>
      )}

      {/* Scale presets */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">ระดับความคมชัดและคุณภาพ (Scale / DPI)</label>
        <div className="space-y-2.5">
          {qualityPresets.map((preset) => {
            const isSelected = config.scale === preset.scale;
            return (
              <button
                key={preset.scale}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...config, scale: preset.scale })}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500/10'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && <Check size={10} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-sans font-bold text-sm text-gray-900">{preset.label}</span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200/50">
                      {preset.dpi}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${preset.speedColor}`}>
                      {preset.speed}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-normal leading-relaxed">{preset.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
