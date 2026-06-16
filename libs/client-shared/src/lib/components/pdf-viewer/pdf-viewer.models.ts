import { AssetFile } from '@asset-sg/shared/v2';
import { PageViewport } from 'pdfjs-dist';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

export type PdfViewerFile = Pick<AssetFile, 'id' | 'pageRangeClassifications'> & {
  fileName: string;
};

export interface PdfRenderTask {
  promise: Promise<void>;
  cancel(): void;
}

export type PdfRenderMode = 'normal' | 'zoom';

export interface RenderedPage {
  wrapper: HTMLDivElement;
  canvas: HTMLCanvasElement;
  textLayerDiv: HTMLDivElement;
  zoom: number;
  rotation: number;
  baseScale: number;
  textLayerRendered: boolean;
  page?: PDFPageProxy;
  viewport?: PageViewport;
}

export interface RenderingPage {
  epoch: number;
  zoom: number;
  rotation: number;
  baseScale: number;
  renderTask?: PdfRenderTask;
  cancelled?: boolean;
}

export interface PageLayout {
  start: number;
  size: number;
}

export interface PdfViewerVirtualItem {
  index: number;
  key: string | number | bigint;
  start: number;
  end: number;
  size: number;
  pageNum: number;
  pageWidth: number;
  transform: string;
}

// Fit rendered pages slightly inside the available viewer width.
export const PDF_RENDERING_MARGIN = 0.95;
// Zoom bounds and button step size.
export const MAX_ZOOM_LEVEL = 5;
export const MIN_ZOOM_LEVEL = 0.2;
export const ZOOM_STEP = 0.5;
export const ZOOM_STEP_FINE = 0.1;
// Virtual document spacing used by TanStack Virtual and manual scroll anchoring.
export const VIRTUAL_PADDING = 8;
export const VIRTUAL_GAP = 8;
// Default number of pages kept in the virtual range before/after the viewport.
export const DEFAULT_OVERSCAN = 6;
/**
 * Delay in milliseconds after the last zoom commit before PDF.js re-renders are
 * dispatched. During this window only CSS-scaled stale previews are shown, which
 * avoids expensive render-and-cancel cycles during rapid CTRL+wheel zoom.
 */
export const ZOOM_SETTLE_DELAY_MS = 300;
/**
 * Maximum number of PDF.js page render tasks (and therefore concurrent network/byte-range
 * fetches). Lower values reduce simultaneous overlapping requests; higher values fill the viewport faster at the
 * cost of more concurrent CPU/memory/network usage.
 *
 * Zoom mode forces this to 1 to keep the current page snappy.
 * Normal mode uses the configured value.
 */
export const DEFAULT_MAX_CONCURRENT_PAGE_LOADS = 3;
// Delay expensive page rendering only while the active page is changing quickly.
export const CURRENT_PAGE_CHANGE_RENDER_DELAY_MS = 16;
/** Set to `true` to enable verbose PDF-viewer diagnostic logs in the browser console. */
export const PDF_VIEWER_DEBUG = false;
