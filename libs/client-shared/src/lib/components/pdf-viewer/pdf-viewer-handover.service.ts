import { Injectable } from '@angular/core';
import { getDocumentHeight, getDocumentWidth, getPageLayout, getPageWidth } from './pdf-viewer-layout.helper';
import {
  HANDOVER_CROSSFADE_MS,
  HANDOVER_RELEASE_DELAY_MS,
  HANDOVER_SAFETY_TIMEOUT_MS,
  PDF_VIEWER_DEBUG,
  PdfViewerHandoverContext,
} from './pdf-viewer.models';

/**
 * Creates a temporary overlay of reused canvas elements that bridges the visual gap
 * between CSS-transform removal and Angular re-rendering page slots.
 *
 * Lifecycle: `begin()` → pages released individually as fresh renders complete →
 * `end()` once all viewport-only pages are released (or safety timeout).
 */
@Injectable()
export class PdfViewerHandoverService {
  private layerElement: HTMLDivElement | null = null;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;
  private activePages = new Map<number, HTMLElement>();
  private viewportPageNums = new Set<number>();
  private releasedViewportPages = new Set<number>();

  isActive(): boolean {
    return this.layerElement !== null;
  }

  begin(context: PdfViewerHandoverContext): void {
    this.end();

    const { spacerElement, renderer, scrollElement } = context;
    const containerWidth = scrollElement.clientWidth;
    const contentWidth = getDocumentWidth(
      context.pageDimensions,
      containerWidth,
      context.target.baseScale,
      context.target.zoom,
      context.target.rotation,
    );
    const contentHeight = getDocumentHeight(
      context.pageCount,
      context.pageDimensions,
      context.target.baseScale,
      context.target.zoom,
      context.target.rotation,
    );

    const layer = renderer.createElement('div') as HTMLDivElement;
    renderer.addClass(layer, 'viewer__handover-layer');
    renderer.setStyle(layer, 'width', `${contentWidth}px`);
    renderer.setStyle(layer, 'height', `${contentHeight}px`);
    renderer.appendChild(spacerElement, layer);
    this.layerElement = layer;
    this.activePages.clear();
    this.viewportPageNums = new Set(context.viewportPageNums);
    this.releasedViewportPages.clear();

    let reuseCount = 0;
    for (const pageNum of context.visiblePageNums) {
      const rendered = context.getRenderedPage(pageNum);
      if (!rendered || rendered.rotation !== context.source.rotation) {
        continue;
      }

      const layout = getPageLayout(
        pageNum,
        context.pageCount,
        context.pageDimensions,
        context.target.baseScale,
        context.target.zoom,
        context.target.rotation,
      );
      if (!layout) continue;

      const pageWidth = getPageWidth(
        pageNum,
        context.pageDimensions,
        context.target.baseScale,
        context.target.zoom,
        context.target.rotation,
      );

      const pageEl = renderer.createElement('div') as HTMLDivElement;
      renderer.addClass(pageEl, 'handover-page');
      renderer.setStyle(pageEl, 'height', `${layout.size}px`);
      renderer.setStyle(pageEl, 'transform', `translateY(${layout.start}px)`);

      // Reuse the existing canvas element (O(1) DOM reparent, no pixel copy).
      const canvas = rendered.canvas;
      renderer.setStyle(canvas, 'width', `${pageWidth}px`);
      renderer.setStyle(canvas, 'height', 'auto');
      renderer.setStyle(canvas, 'display', 'block');

      renderer.appendChild(pageEl, canvas);
      renderer.appendChild(layer, pageEl);
      this.activePages.set(pageNum, pageEl);
      reuseCount++;
    }

    if (PDF_VIEWER_DEBUG) {
      console.log(
        `%c[pdf-handover] %cbegin: ${reuseCount} reused canvases, viewport=[${[...this.viewportPageNums].join(',')}]`,
        'background: #e83e8c; color: white; padding: 4px; border-radius: 4px;',
        'font-weight: bold;',
      );
    }

    if (reuseCount === 0) {
      this.end();
      return;
    }

    this.safetyTimer = setTimeout(() => {
      if (PDF_VIEWER_DEBUG) {
        console.warn('[pdf-handover] safety timeout — forcing end()');
      }
      this.end();
    }, HANDOVER_SAFETY_TIMEOUT_MS);
  }

  /**
   * Releases a single page from the handover layer with a configurable delay
   * followed by a crossfade transition. The delay ensures the fresh canvas below
   * has been composited on screen before the clone disappears.
   * Once all viewport-only pages have been released, ends the entire handover.
   */
  releasePage(pageNum: number): void {
    const pageEl = this.activePages.get(pageNum);
    if (!pageEl) return;

    this.activePages.delete(pageNum);

    // Track viewport page completion for auto-end.
    if (this.viewportPageNums.has(pageNum)) {
      this.releasedViewportPages.add(pageNum);
    }

    // Delay before crossfade — gives the browser time to composite the fresh canvas.
    setTimeout(() => {
      pageEl.style.transition = `opacity ${HANDOVER_CROSSFADE_MS}ms ease-out`;
      pageEl.style.opacity = '0';
      setTimeout(() => {
        pageEl.remove();
        // End the entire layer once all viewport pages are released and faded.
        if (this.releasedViewportPages.size >= this.viewportPageNums.size) {
          this.end();
        }
      }, HANDOVER_CROSSFADE_MS);
    }, HANDOVER_RELEASE_DELAY_MS);
  }

  end(): void {
    if (this.safetyTimer !== null) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    if (this.layerElement) {
      this.layerElement.remove();
      this.layerElement = null;
    }

    this.activePages.clear();
    this.viewportPageNums.clear();
    this.releasedViewportPages.clear();
  }
}
