import { Injectable } from '@angular/core';

import { AssetEditorTabPageComponent } from '../components/asset-editor-tab-page';

@Injectable()
export class TabPageBridgeService {
  private _tabPage?: AssetEditorTabPageComponent;
  public registerTabPage(tabPage: AssetEditorTabPageComponent) {
    this._tabPage = tabPage;
  }

  public get tabPage(): AssetEditorTabPageComponent | undefined {
    return this._tabPage;
  }
}
