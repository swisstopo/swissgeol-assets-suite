import { fitToSwitzerland } from '@asset-sg/client-shared';
import { Control } from 'ol/control';
import { easeOut } from 'ol/easing';
import View from 'ol/View';

export class ZoomControl extends Control {
  zoomIn(): void {
    this.changeZoom(1);
  }

  zoomOut(): void {
    this.changeZoom(-1);
  }

  resetZoom(): void {
    const view = this.view;
    if (view == null) {
      return;
    }
    fitToSwitzerland(view, true);
  }

  private changeZoom(delta: number): void {
    const view = this.view;
    if (view == null) {
      return;
    }
    const zoom = view.getZoom();
    if (zoom == null) {
      return;
    }

    if (view.getAnimating()) {
      view.cancelAnimations();
    }
    view.animate({
      zoom: view.getConstrainedZoom(zoom + delta),
      duration: 250,
      easing: easeOut,
    });
  }

  private get view(): View | null {
    return this.getMap()?.getView() ?? null;
  }
}
