import { inject, Injectable, NgZone, RendererFactory2 } from '@angular/core';

interface PdfViewerInputHandlers {
  getScrollElement: () => HTMLDivElement | undefined;
  getCurrentPage: () => number;
  onScroll: () => void;
  navigateToPage: (pageNum: number) => void;
  setSpacePanMode: (enabled: boolean) => void;
  setPanning: (enabled: boolean) => void;
}

@Injectable()
export class PdfViewerInputService {
  private readonly ngZone = inject(NgZone);
  private readonly renderer = inject(RendererFactory2).createRenderer(null, null);

  private handlers: PdfViewerInputHandlers | null = null;
  private inputCleanup: (() => void) | null = null;
  private panDragCleanup: (() => void) | null = null;

  private isSpacePressed = false;
  private panDragActive = false;
  private panLastX = 0;
  private panLastY = 0;
  private panPointerId: number | null = null;

  setup(scrollElement: HTMLDivElement, handlers: PdfViewerInputHandlers): void {
    this.destroy();
    this.handlers = handlers;

    const onScroll = () => {
      handlers.onScroll();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (this.isSpaceKey(event)) {
        this.onSpaceDown(event);
        return;
      }
      this.handlePageNavigationKey(event);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (this.isSpaceKey(event)) {
        this.onSpaceUp();
      }
    };
    const onBlur = () => {
      this.onWindowBlur();
    };

    this.ngZone.runOutsideAngular(() => {
      scrollElement.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('keyup', onKeyUp, true);
      window.addEventListener('blur', onBlur, true);
    });

    this.inputCleanup = () => {
      scrollElement.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur, true);
      this.finishPanDrag();
    };
  }

  destroy(): void {
    this.inputCleanup?.();
    this.inputCleanup = null;
    this.handlers = null;
  }

  startPanDrag(event: MouseEvent | PointerEvent): void {
    if (this.panDragActive || !this.isSpacePressed || event.button !== 0) return;

    const scrollEl = this.handlers?.getScrollElement();
    if (!scrollEl) return;

    this.panDragActive = true;
    this.panLastX = event.clientX;
    this.panLastY = event.clientY;
    this.panPointerId = 'pointerId' in event ? event.pointerId : null;
    if (this.panPointerId !== null) {
      try {
        scrollEl.setPointerCapture(this.panPointerId);
      } catch {
        // The pointer can already be released if the browser cancelled the drag start.
      }
    }
    this.handlers?.setPanning(true);
    this.panDragCleanup?.();
    this.panDragCleanup = this.ngZone.runOutsideAngular(() => {
      const removePointerMove = this.renderer.listen('window', 'pointermove', (moveEvent: PointerEvent) => {
        if (this.panPointerId === null || moveEvent.pointerId === this.panPointerId) this.updatePanDrag(moveEvent);
      });
      const removeMouseMove = this.renderer.listen('window', 'mousemove', (moveEvent: MouseEvent) => {
        this.updatePanDrag(moveEvent);
      });
      const removePointerUp = this.renderer.listen('window', 'pointerup', (upEvent: PointerEvent) => {
        if (this.panPointerId === null || upEvent.pointerId === this.panPointerId) this.finishPanDrag();
      });
      const removeMouseUp = this.renderer.listen('window', 'mouseup', () => {
        this.finishPanDrag();
      });
      const removePointerCancel = this.renderer.listen('window', 'pointercancel', (cancelEvent: PointerEvent) => {
        if (this.panPointerId === null || cancelEvent.pointerId === this.panPointerId) this.finishPanDrag();
      });
      const removeDragStart = this.renderer.listen('window', 'dragstart', (dragEvent: DragEvent) => {
        dragEvent.preventDefault();
      });
      const removeSelectStart = this.renderer.listen('window', 'selectstart', (selectEvent: Event) => {
        selectEvent.preventDefault();
      });
      return () => {
        removePointerMove();
        removeMouseMove();
        removePointerUp();
        removeMouseUp();
        removePointerCancel();
        removeDragStart();
        removeSelectStart();
      };
    });
    event.preventDefault();
  }

  finishPanDrag(): void {
    const scrollEl = this.handlers?.getScrollElement();
    if (scrollEl && this.panPointerId !== null) {
      try {
        scrollEl.releasePointerCapture(this.panPointerId);
      } catch {
        // Ignore release errors for pointers the browser already cleaned up.
      }
    }
    this.panDragActive = false;
    this.panPointerId = null;
    this.handlers?.setPanning(false);
    this.panDragCleanup?.();
    this.panDragCleanup = null;
  }

  private onSpaceDown(event: KeyboardEvent): void {
    if (this.isEditableTarget(event.target)) {
      return;
    }
    if (this.isSpacePressed && event.repeat) {
      event.preventDefault();
      return;
    }
    this.isSpacePressed = true;
    this.setDragMode(true);
    event.preventDefault();
  }

  private onSpaceUp(): void {
    this.isSpacePressed = false;
    this.setDragMode(false);
  }

  private onWindowBlur(): void {
    this.isSpacePressed = false;
    this.setDragMode(false);
  }

  private updatePanDrag(event: MouseEvent | PointerEvent): void {
    const scrollEl = this.handlers?.getScrollElement();
    if (!scrollEl) {
      this.finishPanDrag();
      return;
    }

    const dx = event.clientX - this.panLastX;
    const dy = event.clientY - this.panLastY;
    this.panLastX = event.clientX;
    this.panLastY = event.clientY;

    if (dx !== 0) scrollEl.scrollLeft -= dx;
    if (dy !== 0) scrollEl.scrollTop -= dy;
    event.preventDefault();
  }

  private setDragMode(enabled: boolean): void {
    this.handlers?.setSpacePanMode(enabled);
    if (!enabled) {
      this.finishPanDrag();
    }
  }

  private handlePageNavigationKey(event: KeyboardEvent): boolean {
    if (this.isEditableTarget(event.target)) return false;

    const current = this.handlers?.getCurrentPage() ?? 1;
    const pageNum = current > 0 ? current : 1;
    if (event.code === 'PageDown' || event.key === 'PageDown') {
      this.handlers?.navigateToPage(pageNum + 1);
      event.preventDefault();
      return true;
    }
    if (event.code === 'PageUp' || event.key === 'PageUp') {
      this.handlers?.navigateToPage(pageNum - 1);
      event.preventDefault();
      return true;
    }
    return false;
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
  }

  private isSpaceKey(event: KeyboardEvent): boolean {
    return event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
  }
}
