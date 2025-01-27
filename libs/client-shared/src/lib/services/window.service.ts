import { Injectable } from '@angular/core';
import { Lazy } from 'fp-ts/function';

@Injectable({ providedIn: 'root' })
export class WindowService {
  public delayRequestAnimationFrame(ms: number, f: Lazy<void>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          window.requestAnimationFrame(() => {
            try {
              f();
            } finally {
              resolve();
            }
          }),
        ms
      );
    });
  }
}
