import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AssetIdentifier, AssetIdentifierData } from '@asset-sg/shared/v2';

@Component({
  selector: 'asset-sg-asset-editor-id-list',
  templateUrl: './asset-editor-id-list.component.html',
  styleUrls: ['./asset-editor-id-list.component.scss'],
  standalone: false,
})
export class AssetEditorIdListComponent {
  @Input({ required: true })
  public control!: FormControl<Array<AssetIdentifier | AssetIdentifierData>>;

  public updateAlternativeId(value: string, field: 'value' | 'description', index: number): void {
    const identifier = this.identifiers.map((id, idx) => {
      if (idx === index) {
        return { ...id, [field]: value };
      }
      return id;
    });
    this.control.setValue(identifier);
    this.control.markAsDirty();
  }

  get identifiers(): Array<AssetIdentifier | AssetIdentifierData> {
    return this.control.value;
  }

  delete(identifier: AssetIdentifier | AssetIdentifierData): void {
    const i = this.identifiers.indexOf(identifier);
    const identifiers = [...this.identifiers];
    identifiers.splice(i, 1);
    this.control.setValue(identifiers);
    this.control.markAsDirty();
  }
}
