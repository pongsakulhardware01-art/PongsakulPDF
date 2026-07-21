import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker to use a reliable CDN with the matching version
const version = '6.1.200'; // Match the exact version in package.json
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

/**
 * Loads a PDF file and returns its basic info (like page count).
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    
    // Clean up loading task references safely
    if (pdf && typeof (pdf as any).destroy === 'function') {
      await (pdf as any).destroy();
    }
    
    return pageCount;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    throw new Error('ไม่สามารถอ่านข้อมูลไฟล์ PDF ได้ กรุณาตรวจสอบว่าเป็นไฟล์ PDF ที่สมบูรณ์');
  }
}

/**
 * Renders pages of a PDF sequentially, providing progress callbacks.
 */
export async function convertPdf(
  file: File,
  scale: number,
  format: 'png' | 'jpeg',
  quality: number,
  onPageConverted: (
    pageNumber: number,
    totalPages: number,
    dataUrl: string,
    width: number,
    height: number
  ) => void,
  onFailure: (errorMsg: string) => void
): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Determine the viewport dimension based on scale
      const viewport = page.getViewport({ scale });
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('ไม่สามารถสร้าง 2D Canvas Context ในบราวเซอร์ได้');
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Render PDF page into canvas context (casting renderContext to any to be flexible across versions)
      const renderContext: any = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };
      
      await page.render(renderContext).promise;
      
      // Export as Data URL
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? quality : undefined);
      
      // Trigger callback
      onPageConverted(pageNum, totalPages, dataUrl, viewport.width, viewport.height);
      
      // Clean up canvas memory immediately
      canvas.width = 0;
      canvas.height = 0;
    }
    
    if (pdf && typeof (pdf as any).destroy === 'function') {
      await (pdf as any).destroy();
    }
  } catch (error: any) {
    console.error('Error converting PDF:', error);
    onFailure(error?.message || 'เกิดข้อผิดพลาดระหว่างการแปลงไฟล์ PDF');
  }
}
