import Collection from 'ol/Collection';
import { Control } from 'ol/control';
import { easeOut } from 'ol/easing';

import { ZoomControlsComponent } from './zoom-controls.component';

export interface Origin {
    center: number[];
    zoom: number;
}

export function olZoomControls(dcmnt: Document, zoomControlsComponent: ZoomControlsComponent) {
    const controls = new Collection<Control>();

    controls.push(new CustomZoom(dcmnt, zoomControlsComponent));

    return controls;
}

class CustomZoom extends Control {
    private readonly duration_ = 250;

    constructor(dcmnt: Document, zoomControlsComponent: ZoomControlsComponent) {
        super({ element: dcmnt.createElement('div') });

        const delta = 1;

        zoomControlsComponent.zoomPlusClicked$.subscribe(e => {
            this.handleClick_(delta, e);
        });
        zoomControlsComponent.zoomMinusClicked$.subscribe(e => {
            this.handleClick_(-delta, e);
        });
        const element = this.element;
        element.appendChild(zoomControlsComponent.host.nativeElement);
    }

    handleClick_(delta: number, event: Event) {
        event.preventDefault();
        this.zoomByDelta_(delta);
    }

    zoomByDelta_(delta: number) {
        const map = this.getMap();
        const view = map?.getView();
        if (!view) {
            return;
        }
        const currentZoom = view.getZoom();
        if (currentZoom !== undefined) {
            const newZoom = view.getConstrainedZoom(currentZoom + delta);
            if (this.duration_ > 0) {
                if (view.getAnimating()) {
                    view.cancelAnimations();
                }
                view.animate({
                    zoom: newZoom,
                    duration: this.duration_,
                    easing: easeOut,
                });
            } else {
                if (newZoom != null) {
                    view.setZoom(newZoom);
                }
            }
        }
    }
}
