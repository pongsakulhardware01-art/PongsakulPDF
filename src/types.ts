export interface PDFPageImage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface PDFFile {
  id: string;
  file: File;
  name: string; // original name without .pdf extension
  size: number;
  pageCount: number;
  status: 'idle' | 'loading' | 'processing' | 'completed' | 'error';
  progress: number; // percentage of pages converted
  currentPage: number; // current page being processed
  errorMsg?: string;
  pages: PDFPageImage[];
}

export interface ConversionConfig {
  scale: number; // Scale multiplier (1 = ~96 DPI, 2 = ~150 DPI, 3 = ~300 DPI, 4 = ~400 DPI)
  format: 'png' | 'jpeg';
  quality: number; // For jpeg format (0.1 to 1.0)
}
