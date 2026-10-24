export type FilterType = 'original' | 'color' | 'bw' | 'grayscale' | 'lighten' | 'dark' | 'noise';

export type PdfPageSize = 'a4' | 'letter' | 'a5' | 'a3';

export interface Point {
  x: number;
  y: number;
}

export interface CornerPoints {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
}

export interface DocPage {
  id: string;
  originalBlob?: Blob;
  processedBlob?: Blob;
  originalDataUrl: string; // compressed original capture / blob URL
  processedDataUrl: string; // after crop + filter + brightness + contrast + rotation
  width: number;
  height: number;
  filter: FilterType;
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  rotation: number; // 0, 90, 180, 270
  cropPoints?: CornerPoints; // normalized 0..1
}

export interface ScannedDocument {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  pageCount: number;
  thumbnail: string;
  pages: DocPage[];
}

export interface AppSettings {
  defaultPdfSize: PdfPageSize;
  defaultFilter: FilterType;
  theme: 'dark' | 'light';
}

export type ActiveScreen = 
  | 'home' 
  | 'camera' 
  | 'crop' 
  | 'filter' 
  | 'document-detail' 
  | 'images-to-pdf' 
  | 'qr-tools' 
  | 'settings';
