import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private hideDisclaimer = false;

  public setHideDisclaimer(value: boolean): void {
    this.hideDisclaimer = value;
  }

  public getHideDisclaimer(): boolean {
    return this.hideDisclaimer;
  }
}
