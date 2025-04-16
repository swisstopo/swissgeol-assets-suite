import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AlternativeId } from '../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-asset-editor-id-list',
  templateUrl: './asset-editor-id-list.component.html',
  styleUrls: ['./asset-editor-id-list.component.scss'],
  standalone: false,
})
export class AssetEditorIdListComponent {
  @Input({ required: true })
  public control!: FormControl<AlternativeId[]>;

  public updateAlternativeId(
    value: string,
    alternativeId: AlternativeId,
    field: keyof Omit<AlternativeId, 'idId'>,
  ): void {
    const ids = this.ids.map((id) => {
      if (id.idId === alternativeId.idId) {
        return { ...id, [field]: value };
      }
      return id;
    });
    this.control.setValue(ids);
  }

  get ids(): AlternativeId[] {
    return this.control.value;
  }

  delete(id: AlternativeId): void {
    const i = this.ids.indexOf(id);
    const ids = [...this.ids];
    ids.splice(i, 1);
    this.control.setValue(ids);
  }
}
