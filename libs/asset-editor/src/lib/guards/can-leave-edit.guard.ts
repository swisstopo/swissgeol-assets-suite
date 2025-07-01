import { CanDeactivateFn } from '@angular/router';
import { AssetEditorPageComponent } from '../components/asset-editor-page/asset-editor-page.component';

export const canLeaveEditGuard: CanDeactivateFn<AssetEditorPageComponent> = (component, _ars, _crss, target) =>
  component.canDeactivate(target);
