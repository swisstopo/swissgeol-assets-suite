import { AssetFile } from '@asset-sg/shared/v2';

export type PdfViewerFile = Pick<AssetFile, 'id' | 'pageRangeClassifications'> & {
  fileName: string;
};

export interface RenderedPage {
  wrapper: HTMLDivElement;
  canvas: HTMLCanvasElement;
  textLayerDiv: HTMLDivElement;
  zoom: number;
  rotation: number;
}

export interface RenderingPage {
  epoch: number;
  zoom: number;
  rotation: number;
}

export interface ScrollAnchor {
  pageNum: number;
  ratio: number;
  align?: 'start';
}

export interface PageLayout {
  start: number;
  size: number;
}

export interface PdfViewerVirtualItem {
  index: number;
}

// Fit rendered pages slightly inside the available viewer width.
export const PDF_RENDERING_MARGIN = 0.95;
// Zoom bounds and button step size.
export const MAX_ZOOM_LEVEL = 5;
export const MIN_ZOOM_LEVEL = 1;
export const ZOOM_STEP = 0.5;
// Virtual document spacing used by TanStack Virtual and manual scroll anchoring.
export const VIRTUAL_PADDING = 8;
export const VIRTUAL_GAP = 8;
// Default number of pages kept in the virtual range before/after the viewport.
export const DEFAULT_OVERSCAN = 4;
// Default maximum number of PDF.js page render tasks allowed at the same time.
export const DEFAULT_MAX_CONCURRENT_PAGE_LOADS = 4;
// Debounce for non-scroll render refreshes such as zoom, rotation, resize, and initial load.
export const RENDER_REFRESH_DELAY_MS = 60;
// Delay expensive page rendering only while the active page is changing quickly.
export const CURRENT_PAGE_CHANGE_RENDER_DELAY_MS = 60;
// Defers work until Angular has flushed the virtual page-slot DOM updates.
export const DOM_RENDER_SETTLE_DELAY_MS = 0;
